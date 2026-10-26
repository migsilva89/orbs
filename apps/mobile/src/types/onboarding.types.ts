export interface OnboardingRouteParams extends Record<string, string | string[] | undefined> {
  step?: string;
  handle?: string;
}
