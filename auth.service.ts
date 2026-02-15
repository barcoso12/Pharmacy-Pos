import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  // Simulate a user database
  private usersSubject = new BehaviorSubject<User[]>([
    { id: '1', username: 'admin', passwordHash: 'adminpass', role: UserRole.Admin },
    { id: '2', username: 'pharmacist', passwordHash: 'pharmpass', role: UserRole.Pharmacist },
    { id: '3', username: 'cashier', passwordHash: 'cashpass', role: UserRole.Cashier },
  ]);
  public users$ = this.usersSubject.asObservable();

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  public hasRole(requiredRoles: UserRole[]): boolean {
    if (!this.currentUserValue) {
      return false;
    }
    return requiredRoles.includes(this.currentUserValue.role);
  }

  login(username: string, password: string): Observable<boolean> {
    // In a real application, you would hash the password and compare it
    // with the stored hash from a backend API.
    const user = this.usersSubject.value.find(u => u.username === username && u.passwordHash === password);

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.notificationService.show(`Welcome, ${user.username}!`, 'success');
      this.router.navigate(['/dashboard']);
      return of(true);
    } else {
      this.notificationService.show('Invalid username or password.', 'error');
      return of(false);
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.notificationService.show('You have been logged out.', 'info');
    this.router.navigate(['/login']);
  }

  addUser(user: Omit<User, 'id'>): void {
    const newUser = { ...user, id: Date.now().toString() };
    this.usersSubject.next([...this.usersSubject.value, newUser]);
  }

  updateUser(user: User): void {
    const users = this.usersSubject.value;
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      const updatedUsers = [...users];
      updatedUsers[index] = user;
      this.usersSubject.next(updatedUsers);

      // Update current user if it's the one being edited
      if (this.currentUserValue?.id === user.id) {
        const updatedCurrentUser = { ...user };
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
        this.currentUserSubject.next(updatedCurrentUser);
      }
    }
  }

  deleteUser(id: string): void {
    const users = this.usersSubject.value.filter(u => u.id !== id);
    this.usersSubject.next(users);
  }
}