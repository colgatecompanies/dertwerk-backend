import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['admin'],

  // TOTP multi-factor auth: available, and deliberately not in force.
  //
  // `OPTIONAL` means the pool CAN do MFA and no user is required to. Today
  // that is a no-op for everyone: enrolling a device needs a UI that calls
  // setUpTOTP, and no DertWerk app has one (checked across all six). So
  // nothing prompts, nothing changes at sign-in, and this costs a user
  // exactly nothing.
  //
  // 🚨 It is here rather than left uncommitted on purpose. An undeployed
  // change to this file would mean the repo described a pool that production
  // did not have, and the next backend deploy -- made by someone doing
  // something else entirely -- would switch MFA on without anyone deciding
  // to. Deployed as OPTIONAL, repo and reality agree.
  //
  // TOTP only. SMS MFA needs SNS out of its sandbox (currently capped at
  // $1/mo), so offering it would hand people a second factor that cannot
  // deliver.
  //
  // To actually REQUIRE it later:
  //   1. Rehearse first -- this is rehearsable, unlike most auth changes.
  //      Force it on ONE user and sign in as them:
  //        aws cognito-idp admin-set-user-mfa-preference \
  //          --user-pool-id us-east-2_oORq8AaqQ --username <sub> \
  //          --software-token-mfa-settings Enabled=true,PreferredMfa=true
  //   2. Check the setup + challenge screens render. They should:
  //      BrandedAuthenticator overrides only Header and Footer, so Amplify's
  //      own TOTP screens come through and pick up the theme tokens.
  //   3. Then change OPTIONAL to REQUIRED here.
  //
  // 🚨 This pool is shared by ALL SIX apps. Requiring MFA is a hard cutover
  // for every one of them at once, and there is no staging pool to try it on.
  // A lockout is recoverable via admin-set-user-mfa-preference, but only by
  // someone with AWS access.
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
});
