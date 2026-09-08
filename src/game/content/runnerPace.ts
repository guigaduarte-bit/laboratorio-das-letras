/** Duração das etapas animadas em milissegundos; a escolha das letras não tem prazo. */
export const RUNNER_TIMINGS = {
    travel: 1700,
    approach: 500,
    retry: 600,
    collect: 850,
    finish: 2200
} as const;

/** Velocidade máxima do percurso 3D em unidades de mundo por segundo. */
export const RUNNER_SPEED = 8.2;
