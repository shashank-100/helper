import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { disconnectGitHub, updateGitHubRepo } from "@/lib/data/mailbox";
import { checkRepositoryIssuesEnabled, listRepositories } from "@/lib/github/client";
import { mailboxProcedure } from "./procedure";

export const githubRouter = {
  repositories: mailboxProcedure.query(async ({ ctx }) => {
    if (!ctx.mailbox.githubInstallationId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "GitHub is not connected to this mailbox",
      });
    }

    const repositories = await listRepositories(ctx.mailbox.githubInstallationId);
    return repositories;
  }),
  disconnect: mailboxProcedure.mutation(async ({ ctx }) => {
    await disconnectGitHub(ctx.mailbox.id);
  }),
  updateRepo: mailboxProcedure
    .input(
      z.object({
        repoOwner: z.string(),
        repoName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.mailbox.githubInstallationId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "GitHub is not connected to this mailbox",
        });
      }

      try {
        const issuesEnabled = await checkRepositoryIssuesEnabled({
          installationId: ctx.mailbox.githubInstallationId,
          owner: input.repoOwner,
          repo: input.repoName,
        });

        if (!issuesEnabled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Issues are disabled for this repository. Please enable issues in the repository settings.",
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check repository issues status. Please try again.",
        });
      }

      await updateGitHubRepo(ctx.mailbox.id, input.repoOwner, input.repoName);
    }),
};
