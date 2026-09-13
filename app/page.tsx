"use client";

import type { NextPage } from 'next';
import { Capacitor } from '@capacitor/core';
import { usePomodoro } from '../hooks/usePomodoro';
import MobileView from '../components/mobile/MobileView';
import DesktopView from '../components/desktop/DesktopView';

const HomePage: NextPage = () => {
    const pomodoroProps = usePomodoro();
    const isNativeMobile = Capacitor.isNativePlatform();

    return (
        <>
            {/* Native Mobile or Mobile Browser Viewports */}
            <div className={isNativeMobile ? "block" : "block md:hidden"}>
                <MobileView {...pomodoroProps} />
            </div>

            {/* Desktop Web Viewports */}
            <div className={isNativeMobile ? "hidden" : "hidden md:block"}>
                <DesktopView {...pomodoroProps} />
            </div>
        </>
    );
};

export default HomePage;