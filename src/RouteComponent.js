import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SecuredPage } from './pages/SecuredPage';
import { NotFound } from './pages/NotFoundPage';
import { AppHome } from './pages/AppHome';
import { PropertyReport } from './pages/Propertyreport';
import React from 'react';
import { HandleLogout } from './pages/LogoutPage';

export const RouteComponent = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<AppHome />} exact/>
				<Route path="/page" element={<PropertyReport />} />
				<Route path="/secure" element={<SecuredPage/>} />
				<Route path="/logout" element={<HandleLogout />} />
				<Route path="*" element={<NotFound />} />
        	</Routes>
		</Router>
	)
}