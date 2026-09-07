import React,{useEffect,useState} from 'react';
import {Icon} from './ui';
export default function ThemeControl(){const[theme,setTheme]=useState(localStorage.getItem('astra-theme')||'dark');useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('astra-theme',theme)},[theme]);return <button className="theme-toggle" aria-label={'Use '+(theme==='dark'?'light':'dark')+' theme'} onClick={()=>setTheme(theme==='dark'?'light':'dark')}><Icon name={theme==='dark'?'Sun':'Moon'}/></button>}
