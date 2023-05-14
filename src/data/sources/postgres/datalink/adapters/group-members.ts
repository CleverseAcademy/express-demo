import { UserOnGroup } from "@prisma/client";
import { DataModelUser } from "./db-only";
import userAdapter from "./user";

import { IGroup } from "../../../../../domain/entities/group";
import { IUser } from "../../../../../domain/entities/user";

// The type returned from the database
interface DataModelGroupMember extends UserOnGroup {
  user: DataModelUser;
}

// Without field `id` and `user`, for creating an entry
// for model UserOnGroup (relation table)
interface IDataModelGroupMember {
  userId: string;
}

// Supplied to PrismaClient().group.create when the new group already
// has existing users as members
interface GroupMemberConnectUser {
  user: {
    connect: {
      id: string;
    };
  };
}

function dataModelGroupMembers(group: IGroup): IDataModelGroupMember[] {
  return group.getMembers().map((user): IDataModelGroupMember => {
    return { userId: user.id };
  });
}

function connectUsersToGroupMembers(
  members: IUser[],
): GroupMemberConnectUser[] {
  return members.map((member): GroupMemberConnectUser => {
    return {
      user: {
        connect: {
          id: member.id,
        },
      },
    };
  });
}

function dataModelGroupMembersToUsers(
  members: DataModelGroupMember[],
): IUser[] {
  return members.map((member) => userAdapter.dataModelUserToIUser(member.user));
}

function userToGroupMember(user: IUser, group: IGroup): IDataModelGroupMember {
  return {
    userId: user.id,
  };
}

function usersToGroupMembers(
  users: IUser[],
  group: IGroup,
): IDataModelGroupMember[] {
  return users.map((user) => userToGroupMember(user, group));
}

export {
  DataModelGroupMember,
  IDataModelGroupMember,
  dataModelGroupMembers,
  dataModelGroupMembersToUsers,
  userToGroupMember,
  usersToGroupMembers,
  connectUsersToGroupMembers,
};
