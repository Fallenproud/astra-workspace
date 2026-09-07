import React, {useEffect} from 'react';import{createRoot}from'react-dom/client';import Site from './Site.jsx';import './styles.css';
function ReadySignal(){useEffect(()=>{window.astraBoot?.ready();},[]);return null;}
createRoot(document.getElementById('root')).render(<><Site/><ReadySignal/></>);
import './polished.css';
import './canonical.css';
