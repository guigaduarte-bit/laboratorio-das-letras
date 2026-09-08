import EventEmitter from 'eventemitter3';

/** Comunicação compartilhada entre interface e jogos, sem carregar um renderizador. */
export const EventBus = new EventEmitter();
