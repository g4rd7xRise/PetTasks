export interface IUser {
  id: number;
  name: string;
}

export interface IEffectsState {
  modal: boolean;
  loading: boolean;
  users: IUser[];
}
