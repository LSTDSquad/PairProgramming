import axios from "axios";

export const ENDPOINT = 'https://lkuviqk3c0.execute-api.us-west-2.amazonaws.com/dev/';

//subpath example: updateData/{sessionID}
//callback is what's done after the api call is over.
//tested, works. 
export function apiPutCall(subpath, data, callback, errorCallback) {
    const url = ENDPOINT + subpath;

    axios.put(url, data).then(
        response => {
            if (callback) callback(response);
        },
        error => {
            if (errorCallback) errorCallback(error);
        }
    );
}

export function apiGetCall(subpath, callback, errorCallback) {
    const url = ENDPOINT + subpath;
    return axios.get(url).then(callback, errorCallback);
};