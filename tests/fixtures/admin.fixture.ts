import type { APIRequestContext } from "@playwright/test";
import { test as base } from "@playwright/test";
import { createUser, deleteUser } from "../helpers/user.js";

type Fixtures = {
    api: {
        request: APIRequestContext,
        userId: string,
    }
};

// Using a fixture to include an X-Role header for admin role requests
export const test = base.extend<Fixtures>({
    api: async ({ playwright }, use, testInfo) => {
        const { baseURL, extraHTTPHeaders } = testInfo.project.use;
        const user = await createUser('admin');

        // Create a new APIRequestContext with the X-Role header set to 'admin'
        const apiRequestContext = await playwright.request.newContext({
            ...(baseURL && { baseURL }),
            extraHTTPHeaders: {
                ...extraHTTPHeaders,
                'X-Role': 'admin'
            }
        });
        await use({ request: apiRequestContext, userId: user?.userId }).then(async () => {
            // Clean up the created user after the test completes
            if (user?.userId) {
                await deleteUser(user.userId);
            }
        });
        await apiRequestContext.dispose();
    }
});