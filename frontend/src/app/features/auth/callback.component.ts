import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `<p>Logging in...</p>`,
})
export class CallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.handleCallback(token);
    }
  }
}
