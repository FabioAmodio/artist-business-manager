import { Injectable, inject } from '@angular/core';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { APP_ENVIRONMENT } from '../configuration/environment.tokens';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly environment = inject(APP_ENVIRONMENT);
  private app: FirebaseApp | null = null;
  private authInstance: Auth | null = null;
  private firestoreInstance: Firestore | null = null;

  get isConfigured(): boolean { return this.environment.firebase !== undefined; }

  auth(): Auth {
    return this.authInstance ??= getAuth(this.firebaseApp());
  }

  firestore(): Firestore {
    if (this.firestoreInstance) return this.firestoreInstance;
    const app = this.firebaseApp();
    this.firestoreInstance = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    return this.firestoreInstance;
  }

  private firebaseApp(): FirebaseApp {
    if (this.app) return this.app;
    const config = this.environment.firebase;
    if (!config) throw new Error(`Firebase non configurato nell'ambiente ${this.environment.environmentName}.`);
    this.app = initializeApp(config);
    return this.app;
  }
}
