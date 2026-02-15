import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-box">
        <h2>Pharmacy POS Login</h2>
        <form #loginForm="ngForm" (ngSubmit)="onLogin(loginForm)">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" ngModel required class="form-control" #username="ngModel">
            <div *ngIf="username.invalid && (username.dirty || username.touched)" class="error-text">
              Username is required.
            </div>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" ngModel required class="form-control" #password="ngModel">
             <div *ngIf="password.invalid && (password.dirty || password.touched)" class="error-text">
              Password is required.
            </div>
          </div>
          <button type="submit" class="login-btn" [disabled]="loginForm.invalid">Login</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #ecf0f1;
    }
    .login-box {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
    }
    h2 {
      margin-bottom: 25px;
      color: #2c3e50;
    }
    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }
    .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
    .form-control { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    .login-btn { width: 100%; padding: 12px; font-size: 1.1em; background-color: #2ecc71; color: white; border: none; border-radius: 5px; cursor: pointer; }
    .login-btn:disabled { background-color: #ccc; cursor: not-allowed; }
    .error-text { color: #e74c3c; font-size: 0.8em; margin-top: 4px; }
  `]
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  onLogin(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    const { username, password } = form.value;
    this.authService.login(username, password);
  }
}