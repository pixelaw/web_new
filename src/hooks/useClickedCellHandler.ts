import {useEffect} from 'react';
import {useViewStateStore} from '@/stores/ViewStateStore.ts';

export const useCellClickHandler = () => {
    const {clickedCell, selectedApp} = useViewStateStore();

    useEffect(() => {
        if (!clickedCell) return;


        console.log(`Clicked cell ${clickedCell} in ${selectedApp}`);
    }, [clickedCell, selectedApp]);
};
