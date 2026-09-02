// Single registration point. Modules import gsap/ScrollTrigger from here so a
// plugin can never be used before it is registered, whatever the load order.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
