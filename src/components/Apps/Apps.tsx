import App from "@/components/App/App.tsx";
import styles from './Apps.module.css';
import {AppStore} from "@/webtools/types.ts";

type AppsProps = {
    appStore: AppStore;
    selectedAppName: string | null;
    onSelect: (appName: string) => void;
};

const Apps: React.FC<AppsProps> = ({appStore, selectedAppName, onSelect}) => {

    const allApps = appStore.getAll();

    return (
        <div className={styles.inner}>
            {allApps.map((app, index) => (
                <div
                    key={index}
                    onClick={() => onSelect(app.name)}
                    className={selectedAppName === app.name ? styles.selected : ''}
                >
                    <App icon={app.icon} name={app.name}/>
                </div>
            ))}
        </div>
    );
};

export default Apps;
