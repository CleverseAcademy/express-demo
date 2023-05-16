import { Request, Response } from "express";
import { AuthRequest, JwtTokenPayload, generateJwt } from "../auth/jwt";
import { IHandlerUsers } from "../routes/users";
import resp from "../response";
import {
  IUseCaseUserRegister,
  IUseCaseUserLogin,
  IUseCaseUserLogout,
  IUseCaseUserDeleteUser,
  IUseCaseUserChangePassword,
} from "../../domain/interfaces/usecases/user";

import { AppErrors } from "../../domain/errors";
import { User } from "../../domain/entities/user";

export class HandlerUsers implements IHandlerUsers {
  private readonly usecaseRegister: IUseCaseUserRegister;
  private readonly usecaseLogin: IUseCaseUserLogin;
  private readonly usecaseLogout?: IUseCaseUserLogout;
  private readonly usecaseChangePassword: IUseCaseUserChangePassword;
  private readonly usecaseDeleteUser: IUseCaseUserDeleteUser;

  constructor(arg: {
    register: IUseCaseUserRegister;
    login: IUseCaseUserLogin;
    logout?: IUseCaseUserLogout;
    changePassword: IUseCaseUserChangePassword;
    deleteUser: IUseCaseUserDeleteUser;
  }) {
    this.usecaseRegister = arg.register;
    this.usecaseLogin = arg.login;
    this.usecaseLogout = arg.logout;
    this.usecaseChangePassword = arg.changePassword;
    this.usecaseDeleteUser = arg.deleteUser;
  }

  async register(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;
    if (!email) {
      return resp.MissingField(res, "email");
    }
    if (!password) {
      return resp.MissingField(res, "password");
    }

    return this.usecaseRegister
      .execute(new User({ email }), password)
      .then((user) => {
        return resp.Created(res, { email: user.email, id: user.id });
      })
      .catch((err) => {
        console.error(`failed to create user ${email}: ${err}`);
        return resp.InternalServerError(res, "failed to create user");
      });
  }

  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;
    if (!email) {
      return resp.MissingField(res, "email");
    }
    if (!password) {
      return resp.MissingField(res, "password");
    }

    return this.usecaseLogin
      .execute(new User({ email }), password)
      .then((user) => {
        const payload: JwtTokenPayload = {
          email: user.email,
          id: user.id,
        };

        const token = generateJwt(payload);
        return resp.Ok(res, { email: user.email, id: user.id, token });
      })
      .catch((err) => {
        console.error(`failed to create user ${email}: ${err}`);
        return resp.InternalServerError(res, `failed to login user ${email}`);
      });
  }

  async logout(_req: AuthRequest, res: Response): Promise<Response> {
    if (this.usecaseLogout === undefined) {
      return resp.NotImplemented(res, "login");
    }

    return resp.NotImplemented(res, "login");
  }

  async changePassword(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.payload || !req.payload.email || req.payload.id) {
      return resp.InternalServerError(res, AppErrors.MissingJWTPayload);
    }

    const { newPassword } = req.body;
    if (!newPassword) {
      return resp.MissingField(res, "password");
    }

    const email = req.payload.email;

    return this.usecaseChangePassword
      .execute(new User({ email }), newPassword)
      .then((user) => resp.Ok(res, `password for ${user.email} updated`))
      .catch((err) => {
        console.error(`failed to change password for ${email}: ${err}`);
        return resp.InternalServerError(
          res,
          `failed to update password for ${email}`,
        );
      });
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.payload || !req.payload.email || req.payload.id) {
      return resp.InternalServerError(res, AppErrors.MissingJWTPayload);
    }

    const { email, id } = req.payload;
    if (!email) {
      return resp.InternalServerError(res, AppErrors.MissingJWTPayload);
    }
    if (!id) {
      return resp.InternalServerError(res, AppErrors.MissingJWTPayload);
    }

    const { password } = req.body;
    if (!password) {
      return resp.MissingField(res, "password");
    }

    return this.usecaseDeleteUser
      .execute(new User({ email, id }), password)
      .then(() => resp.Ok(res, `user ${email} deleted`))
      .catch((err) => {
        console.error(`failed to delete user ${email}: ${err}`);
        return resp.InternalServerError(res, `failed to delete user ${email}`);
      });
  }
}
