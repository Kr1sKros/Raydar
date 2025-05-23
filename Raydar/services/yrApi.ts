import {Platform} from "react-native";

export interface UvStrength {
    timestamp:string,
    strength:number;
    temperature:number,
}


export const getCompleteData = async (lat:number, lon:number) => {
    let URL1 = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat="
    let URL2 = "&lon=";
    let URL = URL1 + lat.toString() + URL2 + lon.toString();

    let response:Response;

    if (Platform.OS == "android"){
        response = await fetch(URL
            ,{
            method: "GET",
            headers: {
                "Accept"       : "application/json",
                "Content-Type" : "application/json",
                "User-Agent"   : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
            }}
        );
    } else{
        response = await fetch(URL);
    }

    return await response.json();
}


export const getUvForecast = async (lat:number, lon:number) => {
    let data = await getCompleteData(lat, lon);

    let trimmedData:UvStrength[] = [];

    for (let i = 0; i < data.properties.timeseries.length; i++) {
        trimmedData.push({
            timestamp: data.properties.timeseries[i].time,
            strength: data.properties.timeseries[i].data.instant.details.ultraviolet_index_clear_sky,
            temperature: data.properties.timeseries[i].data.instant.details.air_temperature
        })
    }

    return trimmedData;
}

export const get24HourForecast = (trimmedData:UvStrength[]) => {

    const now = new Date(trimmedData[2].timestamp);
    const twentyFourHoursLater = new Date(Math.round(Date.now()) + 24 * 60 * 60 * 1000); // 24 hours in ms
    const index = trimmedData.findIndex(item => new Date(item.timestamp) > twentyFourHoursLater);

    if (index === -1) {
        // If no item is later than 24 hours, return the whole array
        return [...trimmedData];
    }

    // Splice up to the found index (do not include anything after 24 hours)
    return trimmedData.slice(0, index);
}

export const formatTo12Hour = (isoString: string): string => {
    const date = new Date(isoString);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
        timeZone: timezone,
    });
};

export const getForecastAtTime = async (trimmedData:UvStrength[], targetTime:number): Promise<UvStrength | null> => {
    if (trimmedData.length === 0) return null;

    let closest = trimmedData[0];
    let itemTime;

    for (let i = 0; i < trimmedData.length; i++) {
        itemTime = new Date(trimmedData[i].timestamp).getUTCHours();
        if (itemTime == targetTime) {
            closest = trimmedData[i];
        }
    }
    return closest;
}

