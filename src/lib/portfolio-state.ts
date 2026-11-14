export interface PortfolioState { s?: string; sm?: 'pay' | 'pg' }

/** URLSearchParams tolerates malformed escapes; selectors never receive raw hash input. */
export function parsePortfolioHash(hash: string, scenarioCount: number): PortfolioState {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const state: PortfolioState = {};
  const scenario = params.get('s');
  if (scenario !== null && /^\d+$/.test(scenario) && Number(scenario) < scenarioCount) state.s = String(Number(scenario));
  const machine = params.get('sm');
  if (machine === 'pay' || machine === 'pg') state.sm = machine;
  return state;
}
