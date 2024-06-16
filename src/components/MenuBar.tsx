// src/components/TopBar.tsx

import React from 'react';

import { Link } from 'react-router-dom';

const MenuBar = () => {
    return (
        <div className='w-full h-12 bg-header-primary flex items-center justify-between px-4'>
            <div className='w-[139px] h-[46px] cursor-pointer'>
                <img src="/src/assets/logo/pixeLaw-logo.png"/>
            </div>
            <Link to="/governance" className='text-white text-lg font-bold'>
                Governance page
            </Link>
        </div>
    );
};

export default MenuBar;
