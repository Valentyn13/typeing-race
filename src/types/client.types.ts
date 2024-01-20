export interface IClient {
    id: string,
    username:string|undefined
}
export type IClientList = Array<IClient>

export type IUserData = {
    userName: string,
    id:string,
    ready:boolean,
    gameProgress:number
}

export type IUserDataList = Array<IUserData>

export interface IRoomData {
    name:string;
    numberOfUsers:IUserDataList;
    winnerList:IUserDataList
}


export type IRoomList = Array<IRoomData>

export type IRoomMap = Map<string, IRoomData>
