import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

initializeApp();

interface NotificationDocument {
  readonly title?: string;
  readonly body?: string;
  readonly entityId?: string;
  readonly updatedAt?: string;
  readonly lastDeliveredAt?: string;
}

// Il client calcola e sincronizza il contenuto delle notifiche: questa funzione si limita a leggerle e inviarle via FCM, senza rielaborare le regole.
export const dispatchWorkspaceNotification = onDocumentWritten(
  'workspaces/{workspaceId}/notifications/{notificationId}',
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return; // documento cancellato: nessun invio, la rimozione e gia gestita lato client

    const notification = after.data() as NotificationDocument;
    if (!notification.updatedAt || notification.lastDeliveredAt === notification.updatedAt) return; // gia inviata per questa versione del contenuto

    const { workspaceId } = event.params as { workspaceId: string };
    const firestore = getFirestore();

    // Assunzione di percorso token FCM: workspaces/{workspaceId}/members/{uid}/fcmTokens/{tokenId}, con campo `token`.
    // La registrazione client di questi token non e ancora implementata: va aggiunta prima che questa funzione possa inviare notifiche reali.
    const membersSnapshot = await firestore.collection('workspaces').doc(workspaceId).collection('members').get();
    const tokens: string[] = [];
    for (const member of membersSnapshot.docs) {
      const tokensSnapshot = await member.ref.collection('fcmTokens').get();
      for (const tokenDoc of tokensSnapshot.docs) {
        const token = (tokenDoc.data() as { token?: string }).token;
        if (token) tokens.push(token);
      }
    }

    if (!tokens.length) {
      logger.info(`Nessun token FCM registrato per il workspace ${workspaceId}, notifica non inviata.`);
      return;
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title ?? 'Notifica',
        body: notification.body ?? '',
      },
      data: {
        workspaceId,
        notificationId: event.params.notificationId as string,
        ...(notification.entityId ? { entityId: notification.entityId } : {}),
      },
    });

    logger.info(`Notifica ${event.params.notificationId} inviata: ${response.successCount} ok, ${response.failureCount} falliti.`);

    await after.ref.update({ lastDeliveredAt: notification.updatedAt });
  },
);
