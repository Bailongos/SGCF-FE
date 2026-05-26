import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from '../modal.vue';

vi.mock('animejs', () => ({
  default: {
    animate: vi.fn().mockReturnValue({ then: vi.fn((cb: any) => { cb(); return Promise.resolve(); }) }),
  },
  animate: vi.fn().mockReturnValue({ then: vi.fn((cb: any) => { cb(); return Promise.resolve(); }) }),
}));

const defaultGlobals = {
  stubs: {
    Teleport: false,
    SectionCard: false,
    transition: false,
  },
};

beforeEach(() => {
  document.body.innerHTML = '';
});

function mountModal(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
  return mount(Modal, {
    props: { modelValue: true, ...props },
    slots,
    attachTo: document.body,
    global: defaultGlobals,
  });
}

describe('Modal component', () => {
  it('is hidden when modelValue is false', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: false },
      global: defaultGlobals,
    });
    expect(wrapper.find('.g-modal-overlay').exists()).toBe(false);
  });

  it('is visible when modelValue is true', () => {
    mountModal();
    expect(document.querySelector('.g-modal-overlay')).toBeTruthy();
  });

  it('renders title and subtitle', () => {
    mountModal({ title: 'Test Modal', subtitle: 'Test subtitle' });
    expect(document.body.textContent).toContain('Test Modal');
    expect(document.body.textContent).toContain('Test subtitle');
  });

  it('renders slot content', () => {
    mountModal({}, { default: 'Modal content' });
    expect(document.body.textContent).toContain('Modal content');
  });

  it('shows default footer buttons', () => {
    mountModal({ showFooter: true });
    expect(document.body.textContent).toContain('Cancelar');
    expect(document.body.textContent).toContain('Aceptar');
  });

  it('hides footer when showFooter is false', () => {
    mountModal({ showFooter: false });
    expect(document.body.textContent).not.toContain('Cancelar');
    expect(document.body.textContent).not.toContain('Aceptar');
  });

  it('emits update:modelValue on close button click', async () => {
    const wrapper = mountModal();

    const closeBtn = document.querySelector('.g-modal-close-btn') as HTMLElement;
    await closeBtn?.click();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
  });

  it('emits close event on close', async () => {
    const wrapper = mountModal();

    const closeBtn = document.querySelector('.g-modal-close-btn') as HTMLElement;
    await closeBtn?.click();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits confirm on accept button click', async () => {
    const wrapper = mountModal();

    const buttons = document.querySelectorAll('button');
    const acceptBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Aceptar');
    await acceptBtn?.click();

    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel on cancel button click', async () => {
    const wrapper = mountModal();

    const buttons = document.querySelectorAll('button');
    const cancelBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Cancelar');
    await cancelBtn?.click();

    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('does not close when persistent is true', async () => {
    const wrapper = mountModal({ persistent: true });

    const closeBtn = document.querySelector('.g-modal-close-btn') as HTMLElement;
    await closeBtn?.click();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('closes on overlay click when closeOnOverlay is true', async () => {
    const wrapper = mountModal({ closeOnOverlay: true });

    const overlay = document.querySelector('.g-modal-overlay') as HTMLElement;
    await overlay?.click();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('does not close on overlay click when closeOnOverlay is false', async () => {
    const wrapper = mountModal({ closeOnOverlay: false });

    const overlay = document.querySelector('.g-modal-overlay') as HTMLElement;
    await overlay?.click();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('shows addAnother checkbox when showAddAnother is true', () => {
    mountModal({ showAddAnother: true });
    expect(document.body.textContent).toContain('Agregar otro');
  });

  it('renders footer-extra slot', () => {
    mountModal({}, { 'footer-extra': '<button>Extra</button>' });
    expect(document.body.textContent).toContain('Extra');
  });

  it('renders custom footer slot', () => {
    mountModal({ showFooter: false }, { footer: '<div>Custom footer</div>' });
    expect(document.body.textContent).toContain('Custom footer');
  });

  it('closes on Escape key', async () => {
    const wrapper = mountModal();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
  });

  it('does not close on Escape when persistent', async () => {
    mountModal({ persistent: true });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.g-modal-overlay')).toBeTruthy();
  });
});
