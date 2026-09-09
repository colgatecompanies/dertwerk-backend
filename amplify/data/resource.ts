import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { fetchImageFn } from '../functions/fetch-image/resource';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  // Left over from the Amplify starter template; nothing reads or writes it.
  // Kept rather than deleted because removing the model would drop its
  // DynamoDB table, and a destructive change does not belong in a fix whose
  // whole point is to make this backend deployable again. Its rule moves from
  // publicApiKey to authenticated along with everything else.
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Machinery: a
    .model({
      name: a.string().required(),
      description: a.string(),
      pricePerDay: a.float(),
      pricePerWeek: a.float(),
      pricePerAcre: a.float(),
      images: a.string().array(),
      available: a.boolean().default(true),
      category: a.string(),
      listingStatus: a.enum(['PENDING', 'APPROVED', 'REJECTED']),
      ownerEmail: a.string(),
      zipCode: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
      // Replaces the publicApiKey read grant that used to sit here. Browsing
      // the equipment list is the app's main screen and must stay open to any
      // signed-in user, not just the owner of a listing -- without this,
      // EquipmentPage and EquipmentDetailPage would return nothing for
      // everyone except owners and admins. Requiring sign-in costs nothing
      // here: every route is already wrapped in <Authenticator hideSignUp>.
      allow.authenticated().to(['read']),
    ]),

  Reservation: a
    .model({
      machineryId: a.id().required(),
      machineryName: a.string().required(),
      startDate: a.date().required(),
      endDate: a.date().required(),
      status: a.enum(['PENDING', 'APPROVED', 'REJECTED']),
      requesterEmail: a.string().required(),
      ownerEmail: a.string().required(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read', 'update']),
      allow.group('admin').to(['create', 'read', 'update', 'delete']),
    ]),

  fetchImageFromUrl: a
    .query()
    .arguments({
      url: a.string().required(),
      machineryId: a.string().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(fetchImageFn))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  // 🚨 Was `apiKey` with a 30-day key, and that is what made this backend
  // undeployable. AppSync deletes an API key when it expires, but
  // CloudFormation keeps the reference, so every subsequent update to the data
  // stack failed with:
  //
  //   AWS::AppSync::ApiKey  UPDATE_FAILED
  //   "API key not found: da2-7njgbnpodjhx3pes5omvux3ezy" (404)
  //
  // The key expired around 2026-04, roughly 30 days after the last successful
  // deploy, and by 2026-09-09 the API had zero keys on it. Note the asymmetry
  // that makes this fixable: CloudFormation cannot UPDATE a resource that no
  // longer exists, but it can DELETE one. Dropping the mode removes the
  // resource from the template, which resolves the drift instead of retrying
  // the update that 404s.
  //
  // Nothing loses access. Every model's publicApiKey grant went with it, and
  // all 23 data client calls in equipment-rental already pass
  // `authMode: 'userPool'` explicitly -- audited, not assumed. The app wraps
  // every route in <Authenticator hideSignUp>, so it has no signed-out surface
  // for an API key to serve. Public reads have in fact been broken since the
  // key expired, which is the clearest evidence they were unused.
  //
  // If unauthenticated access is ever genuinely wanted, add the mode back
  // deliberately -- and set a calendar reminder for the expiry, because this
  // failure mode is silent until the next deploy.
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
