import { Component, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NgxSteelBeamsComponent } from '@omnedia/ngx-steel-beams';
import { RankModalComponent } from './rank-modal.component';
import { FaqModalComponent }      from './faq-modal.component';
import { GameSetupModalComponent } from './game-setup-modal.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgxSteelBeamsComponent, RankModalComponent, FaqModalComponent, GameSetupModalComponent],
  template: `
    @if (authService.user(); as user) {
    <div class="shell">

      <!-- ─── Background ─────────────────────────────────────────────── -->
      <om-steel-beams
        class="shell-bg"
        [beamWidth]="10"
        [beamHeight]="20"
        [beamNumber]="10"
        [lightColor]="'#ffffff'"
        [speed]="0.008"
        [noiseIntensity]="3.5"
        [scale]="0.2"
        [rotation]="30"
      ></om-steel-beams>
      <div class="shell-blur"></div>

      <!-- ─── Sidebar ──────────────────────────────────────────────── -->
      <aside class="sidebar" [class.collapsed]="collapsed()">

        <!-- Logo -->
        <div class="sidebar-top">
          @if (!collapsed()) {
            <a routerLink="/dashboard" class="sidebar-logo">
              <span class="logo-text"><span class="logo-match">Match</span><span class="logo-mood">Mood</span></span>
            </a>
          } @else {
            <a routerLink="/dashboard" class="sidebar-logo-mini">
              <span class="logo-mark"></span>
            </a>
          }
          <button class="toggle-btn" (click)="toggle()" [title]="collapsed() ? 'Expand' : 'Collapse'">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
              @if (collapsed()) {
                <path d="M5 3l6 5-6 5"/>
              } @else {
                <path d="M11 3L5 8l6 5"/>
              }
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">

          <a routerLink="/dashboard" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact:true}"
             class="nav-item" [title]="collapsed() ? 'Dashboard' : ''">
            <span class="nav-accent"></span>
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="2" y="2" width="7" height="7" rx="1.5"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5"/>
            </svg>
            @if (!collapsed()) { <span class="nav-label">Dashboard</span> }
          </a>

          <a routerLink="/arena" routerLinkActive="active"
             class="nav-item" [title]="collapsed() ? 'Arena' : ''">
            <span class="nav-accent"></span>
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M4 16L9 11M16 4L11 9M9 11L7 13.5M11 9L13.5 7"/>
              <path d="M4 4l3 3M16 16l-3-3"/>
              <circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            @if (!collapsed()) { <span class="nav-label">Arena</span> }
          </a>

          <a routerLink="/profile" routerLinkActive="active"
             class="nav-item" [title]="collapsed() ? 'My Profile' : ''">
            <span class="nav-accent"></span>
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="10" cy="7" r="3.5"/>
              <path d="M2.5 17c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6"/>
            </svg>
            @if (!collapsed()) { <span class="nav-label">My Profile</span> }
          </a>

          <a routerLink="/leaderboard" routerLinkActive="active"
             class="nav-item" [title]="collapsed() ? 'Leaderboard' : ''">
            <span class="nav-accent"></span>
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="1" y="10" width="4" height="7" rx="1"/>
              <rect x="8" y="5"  width="4" height="12" rx="1"/>
              <rect x="15" y="8" width="4" height="9"  rx="1"/>
            </svg>
            @if (!collapsed()) { <span class="nav-label">Leaderboard</span> }
          </a>

          @if (user.tier === 'FREE') {
            <a routerLink="/subscription" routerLinkActive="active"
               class="nav-item nav-upgrade-premium" [title]="collapsed() ? 'Upgrade' : ''">
              <span class="nav-accent"></span>
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L10 14.2l-4.8 2.5.9-5.3L2.2 7.7l5.4-.8L10 2z"/>
              </svg>
              @if (!collapsed()) { <span class="nav-label">Upgrade</span> }
            </a>
          }
          @if (user.tier === 'PREMIUM') {
            <a routerLink="/subscription" routerLinkActive="active"
               class="nav-item nav-upgrade-enterprise" [title]="collapsed() ? 'Enterprise' : ''">
              <span class="nav-accent"></span>
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M10 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L10 14.2l-4.8 2.5.9-5.3L2.2 7.7l5.4-.8L10 2z"/>
              </svg>
              @if (!collapsed()) { <span class="nav-label">Enterprise</span> }
            </a>
          }
          @if (user.tier === 'ENTERPRISE') {
            <a routerLink="/enterprise" routerLinkActive="active"
               class="nav-item" [title]="collapsed() ? 'Enterprise' : ''">
              <span class="nav-accent"></span>
              <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M4 17V8l6-5 6 5v9"/><path d="M8 17v-5h4v5"/>
              </svg>
              @if (!collapsed()) { <span class="nav-label">Enterprise</span> }
            </a>
          }

        </nav>

        <!-- ── User card (click → popup menu) ── -->
        <div class="user-area" [class.collapsed]="collapsed()">

          <!-- Popup menu — rendered ABOVE the card -->
          @if (menuOpen()) {
            <div class="user-menu" [class.collapsed]="collapsed()">
              <a routerLink="/settings" class="menu-item" (click)="closeMenu()">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                  <path d="M8.07 2.24a2 2 0 0 1 3.86 0l.28 1.06a6.1 6.1 0 0 1 1.5.87l1.05-.29a2 2 0 0 1 2.07 3.08l-.63.87a6.1 6.1 0 0 1 0 1.74l.63.87a2 2 0 0 1-2.07 3.08l-1.05-.29c-.46.34-.97.63-1.5.87l-.28 1.06a2 2 0 0 1-3.86 0l-.28-1.06a6.1 6.1 0 0 1-1.5-.87l-1.05.29a2 2 0 0 1-2.07-3.08l.63-.87a6.1 6.1 0 0 1 0-1.74l-.63-.87A2 2 0 0 1 5.24 4.88l1.05.29c.46-.34.97-.63 1.5-.87z"/>
                  <circle cx="10" cy="10" r="2.5"/>
                </svg>
                <span>Settings</span>
              </a>
              <div class="menu-item menu-item-lang" [class.lang-active]="langOpen()" (click)="toggleLang($event)">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M9 2c0 0-3 3-3 7s3 7 3 7M9 2c0 0 3 3 3 7s-3 7-3 7M2 9h14"/>
                </svg>
                <span>Language</span>
                <svg class="lang-chevron" [class.open]="langOpen()" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" width="10" height="10">
                  <path d="M4 2l4 4-4 4"/>
                </svg>
                @if (langOpen()) {
                  <div class="lang-submenu" (click)="$event.stopPropagation()">
                    <div class="lang-item"><span class="lang-flag">🇪🇸</span><span>Español</span></div>
                    <div class="lang-item"><span class="lang-flag">🇺🇸</span><span>English</span></div>
                    <div class="lang-item"><span class="lang-flag">🇩🇪</span><span>Deutsch</span></div>
                    <div class="lang-item"><span class="lang-flag">🇨🇳</span><span>中文</span></div>
                  </div>
                }
              </div>
              <div class="menu-divider"></div>
              <button class="menu-item menu-item-danger" (click)="logout()">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" width="15" height="15">
                  <path d="M6.5 9H15M12 6l3 3-3 3"/>
                  <path d="M10 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6"/>
                </svg>
                <span>Log out</span>
              </button>
            </div>
          }

          <button
            class="user-card"
            [class.menu-open]="menuOpen()"
            (click)="toggleMenu($event)"
          >
            <div class="user-card-inner">
              <img [src]="user.avatarUrl || 'https://github.com/ghost.png'" class="user-avatar" alt="avatar" />
              @if (!collapsed()) {
                <div class="user-info">
                  <span class="user-name">{{ user.username }}</span>
                  <span class="user-tier tier-{{ user.tier.toLowerCase() }}">{{ tierLabel(user.tier) }}</span>
                </div>
                <svg class="user-chevron" [class.open]="menuOpen()" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
                  <path d="M3 9l4-4 4 4"/>
                </svg>
              }
            </div>
          </button>
        </div>

      </aside>

      <!-- ─── Page content ─────────────────────────────────────────── -->
      <div class="page-content">
        <router-outlet />
      </div>

      <!-- ─── Global modals ────────────────────────────────────────── -->
      <app-rank-modal />
      <app-faq-modal />
      <app-game-setup-modal />

    </div>
    }
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-base, #000);
      color: var(--text-primary, #f0f0f0);
      font-family: 'Inter', -apple-system, sans-serif;
      position: relative;
    }
    .shell-bg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }
    .shell-blur {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      backdrop-filter: blur(8px);
      background: rgba(0, 0, 0, 0.45);
    }
    .sidebar {
      position: relative;
      z-index: 10;
    }
    .page-content {
      position: relative;
      z-index: 1;
    }

    /* ── Sidebar ──────────────────────────────────────────────────── */
    .sidebar {
      width: 224px;
      flex-shrink: 0;
      background: var(--bg-surface, #0d0d0d);
      border-right: 1px solid var(--border, #1f1f1f);
      display: flex;
      flex-direction: column;
      padding: 18px 10px 16px;
      transition: width 240ms cubic-bezier(.4,0,.2,1);
      overflow: visible;
      position: relative;
    }
    .sidebar.collapsed { width: 58px; }

    /* ── Logo ─────────────────────────────────────────────────────── */
    .sidebar-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 6px;
      margin-bottom: 28px;
      min-height: 30px;
    }
    .sidebar.collapsed .sidebar-top { justify-content: center; }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 7px;
      text-decoration: none;
      overflow: hidden;
    }
    .sidebar-logo-mini {
      display: flex;
      align-items: center;
      text-decoration: none;
    }
    .logo-mark {
      color: var(--green, #22c55e);
      font-size: 18px;
      flex-shrink: 0;
      line-height: 1;
    }
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

    .logo-text {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.8px;
      white-space: nowrap;
      color: #fff;
    }
    .logo-text .logo-match {
      color: #fff;
    }
    .logo-text .logo-mood {
      color: var(--green, #22c55e);
    }

    .toggle-btn {
      background: none;
      border: 1px solid var(--border, #1f1f1f);
      color: var(--text-muted, #52525b);
      width: 26px;
      height: 26px;
      border-radius: 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
    }
    .toggle-btn:hover {
      border-color: var(--border-bright, #2a2a2a);
      color: var(--text-secondary, #a1a1aa);
      background: var(--bg-elevated, #141414);
    }

    /* ── Nav ──────────────────────────────────────────────────────── */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 1px;
      flex: 1;
    }

    .nav-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 10px 10px 14px;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted, #52525b);
      text-decoration: none;
      transition: background 150ms ease, color 150ms ease;
      white-space: nowrap;
      overflow: hidden;
    }
    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 10px;
    }

    /* Left accent bar */
    .nav-accent {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%) scaleY(0);
      width: 2.5px;
      height: 18px;
      background: var(--green, #22c55e);
      border-radius: 0 2px 2px 0;
      transition: transform 150ms ease, opacity 150ms ease;
      opacity: 0;
    }

    .nav-item:hover {
      background: var(--bg-elevated, #141414);
      color: var(--text-secondary, #a1a1aa);
    }
    .nav-item:hover .nav-accent {
      transform: translateY(-50%) scaleY(0.5);
      opacity: 0.4;
    }
    .nav-item.active {
      background: var(--bg-elevated, #141414);
      color: var(--text-primary, #fff);
      font-weight: 600;
    }
    .nav-item.active .nav-accent {
      transform: translateY(-50%) scaleY(1);
      opacity: 1;
    }

    /* Label text — subtle slide on hover */
    .nav-label {
      transition: transform 150ms ease;
    }
    .nav-item:hover .nav-label {
      transform: translateX(1px);
    }

    .nav-icon {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
      transition: transform 150ms ease;
    }

    /* Upgrade items */
    .nav-upgrade-premium       { color: var(--green, #22c55e) !important; }
    .nav-upgrade-premium:hover { background: rgba(34,197,94,0.07) !important; }
    .nav-upgrade-enterprise       { color: #a78bfa !important; }
    .nav-upgrade-enterprise:hover { background: rgba(139,92,246,0.07) !important; }

    /* ── User area ────────────────────────────────────────────────── */
    .user-area {
      position: relative;
      margin-top: 12px;
    }

    /* User card button */
    .user-card {
      width: 100%;
      background: var(--bg-elevated, #141414);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 10px;
      overflow: hidden;
      padding: 0;
      cursor: pointer;
      transition:
        border-color 150ms ease,
        background 150ms ease,
        box-shadow 150ms ease;
      outline: none;
    }
    .user-card:hover,
    .user-card.menu-open {
      border-color: var(--border-bright, #2a2a2a);
      background: #1a1a1a;
    }
    .user-card.menu-open {
      border-color: rgba(34,197,94,0.35);
      box-shadow: 0 0 0 1px rgba(34,197,94,0.12);
    }
    .user-card-inner {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 10px;
    }
    .sidebar.collapsed .user-card-inner {
      justify-content: center;
      padding: 4px;
    }
    .user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid var(--border-bright, #2a2a2a);
      flex-shrink: 0;
      object-fit: cover;
      transition: border-color 150ms ease;
    }
    .user-card:hover .user-avatar,
    .user-card.menu-open .user-avatar {
      border-color: rgba(34,197,94,0.4);
    }
    .user-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      text-align: left;
    }
    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary, #a1a1aa);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-tier {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 1px;
    }
    .tier-free       { color: var(--text-muted, #52525b); }
    .tier-premium    { color: var(--green, #22c55e); }
    .tier-enterprise { color: #a78bfa; }

    .user-chevron {
      flex-shrink: 0;
      color: var(--text-muted, #52525b);
      transition: transform 250ms cubic-bezier(.4,0,.2,1), color 150ms ease;
    }
    .user-chevron.open {
      transform: rotate(180deg);
      color: var(--green, #22c55e);
    }

    /* ── Popup menu ───────────────────────────────────────────────── */
    .user-menu {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      right: 0;
      background: var(--bg-elevated, #141414);
      border: 1px solid var(--border-bright, #2a2a2a);
      border-radius: 10px;
      overflow: visible;
      z-index: 100;
      box-shadow:
        0 -8px 24px rgba(0,0,0,0.6),
        0 -2px 8px rgba(0,0,0,0.3);
      animation: menuSlideUp 180ms cubic-bezier(.4,0,.2,1) forwards;
    }
    .user-menu.collapsed {
      right: auto;
      width: 180px;
      left: calc(100% + 8px);
      bottom: 0;
      animation: menuSlideRight 180ms cubic-bezier(.4,0,.2,1) forwards;
    }

    @keyframes menuSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes menuSlideRight {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #a1a1aa);
      text-decoration: none;
      transition: background 120ms ease, color 120ms ease;
      cursor: pointer;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
    }
    .menu-item:first-child { border-radius: 9px 9px 0 0; }
    .menu-item:last-child  { border-radius: 0 0 9px 9px; }
    .menu-item:hover {
      background: rgba(255,255,255,0.04);
      color: var(--text-primary, #fff);
    }
    .menu-item svg { flex-shrink: 0; }

    /* Language submenu */
    .menu-item-lang {
      position: relative;
      cursor: default;
    }
    .menu-item-lang { user-select: none; }
    .menu-item-lang.lang-active {
      background: rgba(255,255,255,0.04);
      color: var(--text-primary, #fff);
    }
    .lang-chevron {
      margin-left: auto;
      opacity: 0.4;
      flex-shrink: 0;
      transition: opacity 150ms ease, transform 150ms ease;
    }
    .lang-chevron.open {
      opacity: 1;
      transform: rotate(90deg);
      color: var(--green, #22c55e);
    }
    .lang-submenu {
      position: absolute;
      left: calc(100% + 6px);
      top: 0;
      background: var(--bg-elevated, #141414);
      border: 1px solid var(--border, #1f1f1f);
      border-radius: 8px;
      padding: 4px;
      min-width: 140px;
      z-index: 200;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      animation: menuSlideRight 150ms cubic-bezier(.4,0,.2,1) forwards;
    }
    /* When sidebar is collapsed the user-menu sits near the bottom — flip submenu upward */
    .user-menu.collapsed .lang-submenu { top: auto; bottom: 0; }
    .lang-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: var(--text-muted, #52525b);
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease;
    }
    .lang-item:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text-primary, #fafafa);
    }
    .lang-flag { font-size: 14px; line-height: 1; }

    .menu-item-danger { color: var(--text-muted, #52525b); }
    .menu-item-danger:hover {
      background: rgba(239,68,68,0.08);
      color: var(--red, #ef4444);
    }
    .menu-item-danger:hover svg { stroke: var(--red, #ef4444); }

    .menu-divider {
      height: 1px;
      background: var(--border, #1f1f1f);
      margin: 3px 0;
    }

    /* Stagger animation for menu items */
    .user-menu .menu-item:nth-child(1) { animation: menuItemIn 200ms 30ms  ease both; }
    .user-menu .menu-item:nth-child(2) { animation: menuItemIn 200ms 60ms  ease both; }
    .user-menu .menu-item:nth-child(4) { animation: menuItemIn 200ms 90ms  ease both; }
    @keyframes menuItemIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── Page content ─────────────────────────────────────────────── */
    .page-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  `],
})
export class ShellComponent {
  collapsed  = signal(localStorage.getItem('sidebar-collapsed') !== 'false');
  menuOpen   = signal(false);
  langOpen   = signal(false);

  constructor(public authService: AuthService, private router: Router) {}

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem('sidebar-collapsed', String(next));
    if (this.menuOpen()) this.menuOpen.set(false);
  }

  toggleMenu(e: Event): void {
    e.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.langOpen.set(false);
  }

  toggleLang(e: Event): void {
    e.stopPropagation();
    this.langOpen.update(v => !v);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.langOpen.set(false);
    this.authService.logout();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuOpen()) { this.menuOpen.set(false); this.langOpen.set(false); }
  }

  tierLabel(tier: string): string {
    if (tier === 'PREMIUM')    return '★ Premium';
    if (tier === 'ENTERPRISE') return '✦ Enterprise';
    return 'Free';
  }
}
