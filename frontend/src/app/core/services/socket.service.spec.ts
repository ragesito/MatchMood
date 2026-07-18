import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';

describe('SocketService', () => {
  let service: SocketService;
  let fakeSocket: { on: jasmine.Spy; off: jasmine.Spy };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SocketService,
        { provide: AuthService, useValue: { getToken: () => 'tok' } },
      ],
    });
    service = TestBed.inject(SocketService);
    fakeSocket = { on: jasmine.createSpy('on'), off: jasmine.createSpy('off') };
    // Inject a fake socket so we can assert registration/teardown without a
    // real connection.
    (service as unknown as { socket: unknown }).socket = fakeSocket;
  });

  it('on() registers the handler on the socket', () => {
    const cb = () => {};
    service.on('match:found', cb);
    expect(fakeSocket.on).toHaveBeenCalledWith('match:found', cb);
  });

  it('on() returns a teardown that removes exactly that handler', () => {
    const cb = () => {};
    const teardown = service.on('match:found', cb);

    expect(fakeSocket.off).not.toHaveBeenCalled();
    teardown();
    // The specific handler is removed — not every listener for the event.
    expect(fakeSocket.off).toHaveBeenCalledWith('match:found', cb);
  });

  it('distinct registrations tear down independently', () => {
    const a = () => {};
    const b = () => {};
    const teardownA = service.on('evt', a);
    service.on('evt', b);

    teardownA();
    expect(fakeSocket.off).toHaveBeenCalledWith('evt', a);
    expect(fakeSocket.off).not.toHaveBeenCalledWith('evt', b);
  });
});
