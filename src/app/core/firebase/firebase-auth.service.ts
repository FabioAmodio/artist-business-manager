import { Injectable, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly firebase = inject(FirebaseService);
  readonly user = signal<User | null>(null);
  readonly initialized = signal(false);
  private unsubscribe: (() => void) | null = null;
  private initializationPromise: Promise<User | null> | null = null;

  start(): void {
    if (this.unsubscribe) return;
    this.initializationPromise = new Promise((resolve) => {
      this.unsubscribe = onAuthStateChanged(this.firebase.auth(), (user) => {
        this.user.set(user);
        this.initialized.set(true);
        resolve(user);
      });
    });
  }

  async whenInitialized(): Promise<User | null> {
    this.start();
    return this.initializationPromise!;
  }

  async signInWithGoogle(): Promise<User> {
    this.start();
    const result = await signInWithPopup(this.firebase.auth(), new GoogleAuthProvider());
    this.user.set(result.user);
    return result.user;
  }

  async signOut(): Promise<void> {
    await signOut(this.firebase.auth());
    this.user.set(null);
  }

  async sendEmailLink(email: string, continueUrl: string): Promise<void> {
    const actionCodeSettings = { url: continueUrl, handleCodeInApp: true };
    await sendSignInLinkToEmail(this.firebase.auth(), email, actionCodeSettings);
    localStorage.setItem('abm-email-link', email);
  }

  isEmailSignInLink(url = window.location.href): boolean { return isSignInWithEmailLink(this.firebase.auth(), url); }

  async completeEmailLink(url = window.location.href, email = localStorage.getItem('abm-email-link') ?? ''): Promise<User> {
    if (!email) throw new Error('Inserisci l\'indirizzo email usato per ricevere l\'invito.');
    const result = await signInWithEmailLink(this.firebase.auth(), email, url);
    localStorage.removeItem('abm-email-link');
    this.user.set(result.user);
    return result.user;
  }
}
