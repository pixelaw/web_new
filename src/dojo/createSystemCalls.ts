import {AccountInterface, BigNumberish} from "starknet";
import {ClientComponents} from "./createClientComponents";
import {ContractComponents} from "./generated/contractComponents";
import type {IWorld} from "./generated/generated";
import {ProposalType} from "./generated/generated";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { client }: { client: IWorld },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _contractComponents: ContractComponents,
  // eslint-disable-next-line no-empty-pattern
  {  }: ClientComponents
) {
  const vote = async (account: AccountInterface, gameId: number, index: number, usePx: number, isInFavor: boolean) => {
    try {
      const { transaction_hash } = await client.actions.vote({
        account,
        gameId,
        index,
        usePx,
        isInFavor
      });

      console.log(
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(e);
    }
  };

  const createProposal = async (account: AccountInterface, gameId: number, proposalType: ProposalType, args: BigNumberish[]) => {
    if (proposalType === ProposalType.Unknown) throw new Error('Unknown proposal type supplied')

    try {
      const { transaction_hash } = await client.actions.createProposal({
        account,
        gameId,
        proposalType,
        args
      });

      await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      console.log(
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      console.log(e);
    }
  };

  return {
    vote,
    createProposal
  };
}