import axios from "axios";
import React, { FormEvent, useState, useEffect, CSSProperties, useRef } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useDispatch, useSelector } from "react-redux";
import { setAuthenticated } from "./../authActions";
import { useCookies } from "react-cookie";
import ReCAPTCHA from "react-google-recaptcha";
import Spinner from "../Spinner";

export const SecuredPage = () => {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [cookies, setCookie] = useCookies(["recaptchaToken", "fromPage"]);
  const dispatch = useDispatch();
  const [submitStatus, setSubmitStatus] = useState("");
  const [showRealContent, setShowRealContent] = useState(false);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const RECAPTCHA_TIMEOUT = 30000;
  const sitekey =
    process.env.REACT_APP_reCAPTCHA_SITE_KEY_V2 || "sample_v2_site_key";

  const [formData, setFormData] = useState({
    nativeName: "",
    lastName: "",
    email: "",
  });

	useEffect(() => {
		const verifyToken = async () => {
		  try {
			setIsLoading(true);
			await axios.get("/verify-jwt");
			setShowRealContent(true);
			setShowRecaptcha(false);
		  } catch (error) {
			setShowRealContent(false);
			setShowRecaptcha(true);
		  } finally {
			setCookie('fromPage', false, { path: '/' });

				// Delay the loader for 3 seconds
				const timer = setTimeout(() => {
					setIsLoading(false);
				}, 2000);
		
				return () => clearTimeout(timer);
		}
		};
	console.log('isauthe', isAuthenticated)
	console.log('frompage', cookies.fromPage)
			if(isAuthenticated && cookies.fromPage){
		  // User navigated from '/page'
		  verifyToken();
		} else {
		  // User did not navigate from '/page'
		  setShowRecaptcha(true);
		  setIsLoading(false);
		}
	  // eslint-disable-next-line react-hooks/exhaustive-deps
	  }, []);


useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (showRecaptcha) {
        timer = setTimeout(() => {
            console.log("reCAPTCHA has not been interacted with for 30 seconds. Resetting...");
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
        }, RECAPTCHA_TIMEOUT);
    }

    return () => clearTimeout(timer);
}, [showRecaptcha]);

  // For the v2 token verification - it is called when the user successfully completes the v2 challenge.
  const onReCAPTCHASuccess = async (token: any) => {
    try {
      const response = await axios.post("/verify-recaptcha-v2", { token });
      if (response.data.success) {
        setShowRealContent(true);
		setShowRecaptcha(false);
      } else {
        setSubmitStatus(
          "Failed to verify reCAPTCHA v2 on secured route. Please try again."
        );
		console.error("Failed to verify reCAPTCHA v2 on secured route. Please try again");
      }
    } catch (error) {
      setSubmitStatus("Error verifying v2 reCAPTCHA.");
	  console.error("Failed to verify reCAPTCHA v2", error);
    }
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitStatus("");

    if (!executeRecaptcha) {
      console.log("not available to execute recaptcha");
      return;
    }

    const gRecaptchaToken = await executeRecaptcha("securePageSubmission");

    try {
      const response = await axios.post("/verify-recaptcha", {
        token: gRecaptchaToken,
        formData,
      });

      if (response?.data?.success === true) {
        console.log("ReCaptcha Verified: ", response?.data);
        console.log(`Success with score: ${response?.data?.score}`);
        setSubmitStatus("ReCaptcha Verified. Access Granted to Secured Page.");
        dispatch(setAuthenticated(true));
      } else {
        console.log(`Failure with score: ${response?.data?.score}`);
        setSubmitStatus(
          "Failed to verify recaptcha on Secure page! You must be a robot!"
        );
      }
    } catch (error) {
      console.error("Error submitting reCAPTCHA", error);
      setSubmitStatus("Error verifying reCAPTCHA.");
    }
  };
  
  if (isLoading) {
	return <Spinner />;
  }

  if (!showRealContent && !isLoading) {
	if (!sitekey) {
		console.error("ReCAPTCHA sitekey is missing");
		return <div>Error: Missing sitekey for ReCAPTCHA</div>;
	  }
    return (
      <div style={divStyle}>
        <h1>Dummy Data Displayed.</h1>
            <div style={centerContentStyle}>
              <ReCAPTCHA
                sitekey={sitekey}
                onChange={onReCAPTCHASuccess}
				ref={recaptchaRef}
              />
            </div>
            {submitStatus && <p>{submitStatus}</p>}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Recaptcha (V3 & V2) Sample - Secure Page
      </h1>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="nativeName"
          placeholder="Native Name"
          style={inputStyle}
          value={formData.nativeName}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          style={inputStyle}
          value={formData.lastName}
          onChange={handleInputChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          style={inputStyle}
          value={formData.email}
          onChange={handleInputChange}
        />
        <input type="submit" style={submitButtonStyle} />
      </form>
      {submitStatus && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>{submitStatus}</p>
      )}
    </div>
  );
};

const inputStyle = {
  border: "1px solid #ccc",
  padding: "10px 15px",
  borderRadius: "5px",
  width: "300px",
};

const submitButtonStyle: CSSProperties = {
  border: "none",
  padding: "10px 15px",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  margin: "4px 2px",
  borderRadius: "5px",
  cursor: "pointer",
  backgroundColor: "#4CAF50",
  color: "white",
};
const divStyle: CSSProperties = {
  backgroundImage: "url(/bg.png)",
  backgroundSize: "cover",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};
const centerContentStyle: CSSProperties = {
  textAlign: "center",
  flex: "1 0 auto",
  marginTop: "10rem",
};
