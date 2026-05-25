import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Chip from '../chip.vue';

describe('Chip component', () => {
  it('renders with default variant', () => {
    const wrapper = mount(Chip);
    const chip = wrapper.find('span');

    expect(chip.exists()).toBe(true);
    expect(chip.classes()).toContain('variant-soft');
  });

  it('renders with specified variant', () => {
    const wrapper = mount(Chip, { props: { variant: 'success' } });
    expect(wrapper.find('span').classes()).toContain('variant-success');
  });

  it('renders with warning variant', () => {
    const wrapper = mount(Chip, { props: { variant: 'warning' } });
    expect(wrapper.find('span').classes()).toContain('variant-warning');
  });

  it('renders with error variant', () => {
    const wrapper = mount(Chip, { props: { variant: 'error' } });
    expect(wrapper.find('span').classes()).toContain('variant-error');
  });

  it('renders with primary variant', () => {
    const wrapper = mount(Chip, { props: { variant: 'primary' } });
    expect(wrapper.find('span').classes()).toContain('variant-primary');
  });

  it('renders slot content', () => {
    const wrapper = mount(Chip, { slots: { default: 'Activo' } });
    expect(wrapper.text()).toBe('Activo');
  });
});
