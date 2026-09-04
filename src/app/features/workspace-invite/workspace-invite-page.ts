import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseAuthService } from '../../core/firebase/firebase-auth.service';
import { WorkspaceService } from '../../core/firebase/workspace.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  selector: 'app-workspace-invite-page',
  templateUrl: './workspace-invite-page.html',
  styleUrl: './workspace-invite-page.scss',
})
export class WorkspaceInvitePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(FirebaseAuthService);
  private readonly workspace = inject(WorkspaceService);
  protected readonly message = signal('Verifica dell\'invito in corso...');
  protected readonly busy = signal(false);
  protected email = '';
  private workspaceId = '';
  private inviteId = '';

  protected authUser() { return this.auth.user(); }

  async ngOnInit(): Promise<void> {
    this.workspaceId = this.route.snapshot.queryParamMap.get('workspaceId') ?? '';
    this.inviteId = this.route.snapshot.queryParamMap.get('inviteId') ?? '';
    if (!this.workspaceId || !this.inviteId) { this.message.set('Link invito non valido.'); return; }
    try {
      this.auth.start();
      await this.auth.whenInitialized();
      if (!this.auth.user()) { this.message.set('Inserisci l\'email che ha ricevuto l\'invito.'); return; }
      await this.acceptInvite();
    } catch (error) { this.message.set(error instanceof Error ? error.message : 'Impossibile accettare l\'invito.'); }
  }

  protected async completeSignIn(): Promise<void> {
    if (this.busy() || !this.email.trim()) return;
    this.busy.set(true);
    try {
      await this.auth.completeEmailLink(window.location.href, this.email.trim().toLowerCase());
      await this.acceptInvite();
    } catch (error) { this.message.set(error instanceof Error ? error.message : 'Impossibile completare l\'accesso.'); }
    finally { this.busy.set(false); }
  }

  private async acceptInvite(): Promise<void> {
    const invite = await this.workspace.getInvite(this.workspaceId, this.inviteId);
    if (!invite) throw new Error('Invito non trovato.');
    await this.workspace.acceptInvite(invite);
    this.message.set('Invito accettato.');
    await this.router.navigateByUrl('/settings');
  }
}