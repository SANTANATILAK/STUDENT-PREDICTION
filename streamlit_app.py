import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px
import os
import urllib.request

# Page configuration
st.set_page_config(
    page_title="Student Performance Prediction Portal",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Load XGBoost model
@st.cache_resource
def load_model():
    model_path = "student_model.pkl"
    if os.path.exists(model_path):
        try:
            return joblib.load(model_path)
        except Exception as e:
            st.error(f"Error loading student_model.pkl: {str(e)}")
    return None

# Load dataset
@st.cache_data
def load_data():
    url = "https://raw.githubusercontent.com/rashida048/Datasets/master/StudentsPerformance.csv"
    try:
        df = pd.read_csv(url)
        df["average_score"] = (df["math score"] + df["reading score"] + df["writing score"]) / 3
        return df
    except Exception as e:
        st.error(f"Error downloading dataset: {str(e)}")
        # Fallback empty df with correct columns
        return pd.DataFrame(columns=[
            "gender", "race/ethnicity", "parental level of education", 
            "lunch", "test preparation course", "math score", 
            "reading score", "writing score", "average_score"
        ])

model = load_model()
df = load_data()

# App Title
st.title("🎓 Student Performance Analytics & Prediction")
st.markdown("Predict student math scores and explore key indicators of academic success using machine learning.")

# Sidebar navigation
st.sidebar.image("https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=300", use_container_width=True)
st.sidebar.title("Navigation")
menu = st.sidebar.selectbox("Go to page:", ["Dashboard", "Prediction", "Analytics"])

# --- DASHBOARD VIEW ---
if menu == "Dashboard":
    st.header("📊 Platform Dashboard")
    
    # Key metrics row
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Student Records", len(df))
    with m2:
        st.metric("Avg. Math Score", f"{df['math score'].mean():.1f}%")
    with m3:
        st.metric("Avg. Reading Score", f"{df['reading score'].mean():.1f}%")
    with m4:
        st.metric("Avg. Writing Score", f"{df['writing score'].mean():.1f}%")

    st.markdown("---")
    
    # Interactive filters
    st.subheader("Explore Dataset")
    col1, col2 = st.columns(2)
    with col1:
        gender_filter = st.multiselect("Filter by Gender", options=df["gender"].unique(), default=df["gender"].unique())
    with col2:
        prep_filter = st.multiselect("Filter by Test Prep Course", options=df["test preparation course"].unique(), default=df["test preparation course"].unique())
        
    filtered_df = df[df["gender"].isin(gender_filter) & df["test preparation course"].isin(prep_filter)]
    st.dataframe(filtered_df.head(10), use_container_width=True)

# --- PREDICTION VIEW ---
elif menu == "Prediction":
    st.header("🔮 Math Score Predictor")
    st.write("Adjust the parameters below to predict a student's Mathematics score using our XGBoost model.")

    if model is None:
        st.warning("⚠️ Prediction model (student_model.pkl) not found. Run download_and_train.py first to generate the model binary.")
    else:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Student Profile Configurator")
            gender = st.selectbox("Gender", ["female", "male"])
            race_ethnicity = st.selectbox("Race / Ethnicity", ["group A", "group B", "group C", "group D", "group E"], index=1)
            parental_education = st.selectbox(
                "Parental Level of Education",
                ["some high school", "high school", "some college", "associate's degree", "bachelor's degree", "master's degree"],
                index=3
            )
            lunch = st.selectbox("Lunch Program", ["standard", "free/reduced"])
            test_prep = st.selectbox("Test Preparation Course", ["none", "completed"])
            
            reading_score = st.slider("Reading Score", min_value=0, max_value=100, value=70)
            writing_score = st.slider("Writing Score", min_value=0, max_value=100, value=70)
            
            # Predict button
            predict_btn = st.button("Run Prediction Model", type="primary")

        with col2:
            st.subheader("Analysis Output")
            if predict_btn:
                # Calculate average score proxy
                average_score = (reading_score + writing_score) / 2
                
                # Make sample df matching model pipeline inputs
                sample = pd.DataFrame({
                    "gender": [gender],
                    "race/ethnicity": [race_ethnicity],
                    "parental level of education": [parental_education],
                    "lunch": [lunch],
                    "test preparation course": [test_prep],
                    "reading score": [reading_score],
                    "writing score": [writing_score],
                    "average_score": [average_score]
                })
                
                try:
                    pred = model.predict(sample)[0]
                    pred = max(0.0, min(100.0, pred))
                    
                    # Display predicted value
                    st.success("Analysis Completed!")
                    st.metric("Predicted Math Score", f"{pred:.1f}%")
                    
                    # Highlight rating levels
                    if pred >= 85:
                        st.info("⭐ **Level: Excellent Standings** (Highly skilled in logical & technical reasoning)")
                    elif pred >= 70:
                        st.info("👍 **Level: Good Standings** (Strong foundation with high literacy scores)")
                    elif pred >= 50:
                        st.warning("⚠️ **Level: Satisfactory** (Passing score, but could benefit from math exercises)")
                    else:
                        st.error("🚨 **Level: Needs Attention** (Critical score prediction. Tutoring highly recommended)")
                        
                except Exception as e:
                    st.error(f"Prediction failed: {str(e)}")
            else:
                st.info("Awaiting input configurations. Fill out the student profile on the left and click 'Run Prediction Model'.")

# --- ANALYTICS VIEW ---
elif menu == "Analytics":
    st.header("📈 Data Science Analytics")
    st.write("Understand the predictive drivers and insights governing academic performance.")

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Score Distributions")
        fig = px.histogram(df, x="average_score", nbins=30, marginal="box", 
                           title="Distribution of Average Scores", color_discrete_sequence=["#D4AF37"])
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.subheader("Gender Performance Comparison")
        fig2 = px.box(df, x="gender", y="average_score", color="gender",
                      title="Average Score Distribution by Gender",
                      color_discrete_map={"female": "#ff4d4d", "male": "#4d79ff"})
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("---")
    
    st.subheader("Parental Education Impact")
    fig3 = px.bar(df, x="parental level of education", y="average_score", color="parental level of education",
                  title="Average Score by Parental Level of Education (Aggregated)",
                  category_orders={"parental level of education": ["some high school", "high school", "some college", "associate's degree", "bachelor's degree", "master's degree"]})
    st.plotly_chart(fig3, use_container_width=True)
