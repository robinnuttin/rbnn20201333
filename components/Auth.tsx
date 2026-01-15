
import React, { useState, useEffect } from 'react';
import { UserConfig, AccountData } from '../types';
import { initiateOAuth } from '../services/oauthService';

interface Props {
  onAuthComplete: (account: AccountData) => void;
}

const Auth: React.FC<Props> = ({ onAuthComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallbackMode, setIsCallbackMode] = useState(false);

  useEffect(() => {
    // Check of we in een callback venster zitten (voor de Implicit Flow)
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('state') || new URLSearchParams(hash.substring(1)).get('state');

    if (hash || urlParams.get('error')) {
      setIsCallbackMode(true);
      if (window.opener) {
        // We sturen de hash (met de tokens) terug naar het hoofdvenster
        window.opener.postMessage({
          type: 'OAUTH_CALLBACK',
          provider: 'google',
          hash: hash,
          state: state,
          error: urlParams.get('error')
        }, window.location.origin);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      const tokenData = await initiateOAuth('google');
      const targetEmail = tokenData.email || 'nuttinrobin@gmail.com';
      
      // Zoek bestaande data of maak nieuwe aan
      const usersDb = JSON.parse(localStorage.getItem('crescoflow_enterprise_db') || '{}');
      
      if (!usersDb[targetEmail]) {
        usersDb[targetEmail] = {
          leads: [], 
          campaigns: [], 
          fbConversations: [], 
          scripts: [], 
          sessions: [],
          config: {
            username: 'Robin Nutin',
            email: targetEmail,
            ghlApiKey: '', 
            instantlyApiKey: '',
            companyWebsite: 'https://crescoflow.be',
            toneOfVoice: 'Professioneel, ROI focus.',
            documents: [], 
            trainingData: [],
            integrations: { gmail: true, calendar: true, ghl: false, instantly: false },
            tokens: { google: tokenData }
          }
        };
      } else {
        // Update bestaande tokens
        usersDb[targetEmail].config.tokens = { ...usersDb[targetEmail].config.tokens, google: tokenData };
      }
      
      localStorage.setItem('crescoflow_enterprise_db', JSON.stringify(usersDb));
      localStorage.setItem('crescoflow_current_user', targetEmail);
      onAuthComplete(usersDb[targetEmail]);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (!err.message.includes("geannuleerd")) {
        alert("Toegang geweigerd. Zorg dat je bent toegevoegd als 'Test User' in Google Cloud of dat de Redirect URI exact klopt.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCallbackMode) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center p-6 space-y-4 font-sans text-white text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl animate-spin">🧠</div>
        <h2 className="text-lg font-black uppercase tracking-[0.3em]">Authenticatie Voltooid</h2>
        <p className="text-slate-400 text-xs">Je kunt dit venster sluiten als het niet automatisch gebeurt.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white p-10 lg:p-14 rounded-[40px] shadow-2xl w-full max-w-md space-y-12 relative overflow-hidden z-10 border border-white/20 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-2xl rotate-6 mx-auto mb-6 border-b-8 border-blue-600">🧠</div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">CRESCOFLOW</h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.6em]">Revenue OS V7.0</p>
        </div>
        
        <div className="space-y-8">
          <p className="text-center text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Log in met je Google Enterprise account om toegang te krijgen tot het Cloud Cluster.
          </p>
          
          <button 
            onClick={handleGoogleLogin}
            disabled={isProcessing}
            className="w-full bg-slate-900 text-white py-5 rounded-[25px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-4 disabled:opacity-50 active:scale-95"
          >
            {isProcessing ? (
              <span className="flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                VERIFIËREN...
              </span>
            ) : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
                Connect via Google Cloud
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-6 border-t border-slate-50 flex justify-center gap-8">
           <a href="https://crescoflow.be/privacy" target="_blank" className="text-[8px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600">Privacy Policy</a>
           <a href="https://crescoflow.be/terms" target="_blank" className="text-[8px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600">Enterprise Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
