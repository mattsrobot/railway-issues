import type { MetaFunction } from "@remix-run/node";
import { Flex, Card } from "~/components";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, } from "@remix-run/react";
import { RequestError, Octokit } from "octokit";

import IssueCard from "./issue-card";
import logger from "~/components/logger";
import { createTokenAuth } from "@octokit/auth-token";

export const meta: MetaFunction = () => {
    return [
        { title: "Org Repo" },
        { name: "description", content: "Welcome to Remix!" },
    ];
};

export async function loader({ params }: LoaderFunctionArgs) {

    const auth = createTokenAuth(process.env.GITHUB_AUTH_TOKEN!);
    const { token } = await auth();
    const octokit = new Octokit({
        auth: token,
    });

    const repo = params.repo ?? "";
    const owner = params.owner ?? "";

    const logRequest = logger.child({ repo, owner, });
    logRequest.info('🏃 starting fetching issues');

    try {

        const { data } = await octokit
            .rest
            .issues
            .listForRepo({ owner: owner, repo: repo });

        logRequest.info('✅ completed fetching issues');

        return json({
            data,
            error: null
        });

    } catch (error) {
        let status, message;

        if (error instanceof RequestError) {
            status = error.status;
            message = error.message;
        } else {
            status = 500;
            message = "Unhandled error";
        }

        const logError = logger.child({
            repo,
            owner,
            message,
            status,
        });

        logError.error('🔥 had an error fetching issues');

        return json({
            data: null,
            error: message
        });
    }
}

export default function Index() {

    const { data, error } = useLoaderData<typeof loader>();

    return (
        <Flex direction="column">
            {!!error && <Card>
                {`Got an error - ${error}`}
            </Card>}
            {data?.map((e) => <IssueCard key={e.id} issue={e} />)}
        </Flex>
    );
}
