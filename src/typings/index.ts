export interface IPInfo {
    country: string;
    isp: string
}

export interface IntIPData extends IPInfo {
    start_ip: number;
}

export interface IPData extends IPInfo {
    ip: string;
}
