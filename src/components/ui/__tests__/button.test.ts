import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '../button.vue';

describe('Button component', () => {
  it('renders with default props', () => {
    const wrapper = mount(Button);
    const btn = wrapper.find('button');

    expect(btn.exists()).toBe(true);
    expect(btn.classes()).toContain('g-btn--md');
    expect(btn.classes()).toContain('g-btn--filled');
    expect(btn.attributes('type')).toBe('button');
  });

  it('renders label text', () => {
    const wrapper = mount(Button, { props: { label: 'Click me' } });
    expect(wrapper.text()).toContain('Click me');
  });

  it('renders slot content over label', () => {
    const wrapper = mount(Button, {
      props: { label: 'Label text' },
      slots: { default: 'Slot content' },
    });
    expect(wrapper.text()).toContain('Slot content');
    expect(wrapper.text()).not.toContain('Label text');
  });

  it('applies size class', () => {
    const wrapper = mount(Button, { props: { size: 'lg' } });
    expect(wrapper.find('button').classes()).toContain('g-btn--lg');
  });

  it('applies variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'outlined' } });
    expect(wrapper.find('button').classes()).toContain('g-btn--outlined');
  });

  it('shows loading spinner and disables button', () => {
    const wrapper = mount(Button, { props: { loading: true } });
    const btn = wrapper.find('button');

    expect(btn.find('.g-btn-spinner').exists()).toBe(true);
    expect(btn.classes()).toContain('g-btn--loading');
    expect(btn.classes()).toContain('g-btn--disabled');
    expect(btn.attributes('disabled')).toBe('');
    expect(btn.attributes('aria-busy')).toBe('true');
  });

  it('disables button with disabled prop', () => {
    const wrapper = mount(Button, { props: { disabled: true } });
    const btn = wrapper.find('button');

    expect(btn.classes()).toContain('g-btn--disabled');
    expect(btn.attributes('disabled')).toBe('');
  });

  it('emits click event on click', async () => {
    const wrapper = mount(Button);

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')![0]![0]).toBeInstanceOf(MouseEvent);
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, { props: { disabled: true } });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('does not emit click when loading', async () => {
    const wrapper = mount(Button, { props: { loading: true } });

    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('renders with custom color', () => {
    const wrapper = mount(Button, { props: { color: '#ff0000' } });
    const btn = wrapper.find('button');

    expect(btn.attributes('style')).toContain('--g-btn-bg: #ff0000');
    expect(btn.attributes('style')).toContain('--g-btn-color: #ff0000');
  });

  it('sets type attribute', () => {
    const wrapper = mount(Button, { props: { type: 'submit' } });
    expect(wrapper.find('button').attributes('type')).toBe('submit');
  });
});
