import React from 'react';
import styles from './Apps.module.css';
import App from "./App.tsx";

const appData = [
    {
        icon: "U+1F58C U+FE0F".split(' ').map(u => String.fromCodePoint(parseInt(u.substring(2), 16))).join(''),
        name: "Paint"
    }
]

const Apps: React.FC = () => {
    return (
        <div className={styles.inner}>
            {appData.map((app, index) => (
                <App key={index} icon={app.icon} name={app.name} />
            ))}
        </div>
    );
};

export default Apps;
