// src/components/TopBar.tsx

import React from 'react';

const MenuBar = () => {
    return (
        <div className='w-full h-12 bg-header-primary flex items-center justify-between px-4'>

            <div className='w-[139px] h-[46px] cursor-pointer'>
                <img src="/src/assets/logo/pixeLaw-logo.png"/>
            </div>
        </div>
    );
};

export default MenuBar;
