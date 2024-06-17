import React, {useEffect} from 'react';
import styles from './Apps.module.css';
import App from "./App/App.tsx";
import {AppStore} from "../webtools/types.ts";


type AppsProps = {
    appStore: AppStore;
};

const Apps: React.FC<AppsProps> = ({appStore}) => {


    useEffect(() => {
        appStore.prepare()
    }, [])

    const allApps = appStore.getAll()

    return (
        <div className={styles.inner}>
            {allApps.map((app, index) => (
                <App key={index} icon={app.icon} name={app.name} />
            ))}
        </div>
    );
};

export default Apps;
