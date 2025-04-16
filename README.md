# Final Fall Design Report

Welcome to our Final Fall Design Report repository. This document outlines our project work in a professional and clear format, ensuring consistency and clarity throughout. Use the Table of Contents below to navigate to specific sections of the report.

## Table of Contents

1. [Team Names and Project Abstract](#team-names-and-project-abstract)
2. [Project Description](#project-description)
3. [User Stories and Design Diagrams](#user-stories-and-design-diagrams)  
    - [User Stories](#user-stories)  
    - [Design Diagrams](#design-diagrams)  
        - Level 0, Level 1, and Level 2 Diagrams  
        - Description of Diagrams  
4. [Project Tasks and Timeline](#project-tasks-and-timeline)  
    - [Task List](#task-list)  
    - [Timeline](#timeline)  
    - [Effort Matrix](#effort-matrix)  
5. [ABET Concerns Essay](#abet-concerns-essay)  
6. [PPT Slideshow](#ppt-slideshow)  
7. [Self-Assessment Essays](#self-assessment-essays)  
8. [Professional Biographies](#professional-biographies)  
9. [Budget](#budget)  
    - [Expenses to Date](#expenses-to-date)  
    - [Donated Items and Sources](#donated-items-and-sources)  
10. [Test Plan and Results](#test-plan-and-results)
11. [User Manual](#user-manual)
12. [Spring Final PPT Presentation](#spring-final-ppt-presentation)
13. [Final Expo Poster](#final-expo-poster)
14. [Summary of Expenses & Hours and Justification](#summary-of-expenses--hours-and-justification)

---

## Team Names and Project Abstract

- **Team Name:** QSine
- **Advisor:** Professor Annexstein
- **Members:** Matthew Bryant, Kaleb Bishop, Hung Nguyen, Eric Buffington
- **Project Abstract:** QSine is a machine-learning app that uses image recognition and text processing to identify dishes and allergens from images or text descriptions. Integrated with a robust recipe and allergen database, it offers quick, reliable insights for safe dining and improves accessibility and efficiency. With QSine, we empower users to make informed choices, enhancing their quality of life.

[Full Page](./Assignments/Senior%20Design%20I/Assignment2_Team_Formation_and_Project_Description/README.md)

---

## Project Description
   QSine is a machine learning application designed to enhance food safety for individuals with allergies. By leveraging advanced image recognition and natural language processing (NLP) models, the app identifies dishes and their associated allergens based on images or text descriptions. The system integrates seamlessly with a robust database of recipes and allergens, providing users with quick and reliable insights to make informed dining choices. Our project aims to deliver an accessible, efficient, and secure tool to improve the quality of life for individuals navigating food allergies.

[Full Page](./Assignments/Senior%20Design%20I/Assignment2_Team_Formation_and_Project_Description/README.md)

---

## User Stories and Design Diagrams

### User Stories

1. **As a person with food allergies,** I want to scan a menu for potential allergens so that I can confidently decide what to order without risking an allergic reaction.

2. **As a parent of a child with allergies,** I want to take a photo of a packaged food item and have the app identify any allergens so that I can ensure it's safe for my child to consume.

3. **As a caregiver,** I want to input a list of ingredients into the app to identify hidden allergens so that I can prepare meals that are safe for the person I care for.

4. **As a user with multiple allergies,** I want to be alerted to the presence of allergens and their aliases in recipes so that I can avoid unexpected allergic reactions.

5. **As a frequent traveler with food allergies,** I want to quickly analyze foreign menus for potential allergens using text or image input so that I can make safe dining choices in unfamiliar places.

[Full Page](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/User_Stories.md)

### Design Diagrams

- **Level 0 Diagram:**  
![Design D0 Diagram](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D0_diagram.png)

- **Level 0 Example:**
![Design D0 Example](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D0-1.png)

- **Level 1 Diagram:**
![Design D1 Diagram](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D1_diagram.png)

- **Level 1 Example:**
![Design D1 Example](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D1.png)

- **Level 2 Diagram:**
![Design D2 Diagram](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D2_diagram.png)

- **Level 2 Example:**
![Design D2 Example](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README_images/D2.png)

## Conventions and Description of Components

### Conventions

1. **Boxes/Figures:**
   - Represent distinct components, subsystems, or processes in the Allergen Detection System.
   - Differentiated by color to indicate their type or role within the system:
     - **Gray:** Represents the main system (e.g., Allergen Detection System).
     - **Yellow:** Highlights subsystems (e.g., Text Processing Module, Image Processing Module).
     - **Green:** Represents internal processes or operations within subsystems.
     - **Red:** Denotes interactions with external systems or databases (e.g., Allergen Database).
   - **Stick Figures:** Represent end users interacting with the system.

2. **Lines/Arrows:**
   - Show the flow of data or control between components.
   - Direction indicates the flow, starting from inputs and leading to outputs.

3. **Icons/Visual Markers:**
   - Specific icons (e.g., document icons for text, camera icons for images) visually represent input types.
   - Symbols for processing steps (e.g., gears for processing or database symbols) indicate system actions.

---

### Purpose of Each Component

1. **Text Input/Processing (Yellow)**
   - **Purpose:** Enables users to input text data, such as ingredient lists or menu descriptions, for allergen analysis.
   - **Details:** Utilizes NLP techniques to parse and extract relevant terms from the text for allergen detection.

2. **Image Input/Processing (Yellow)**
   - **Purpose:** Allows users to upload images (e.g., photos of food items, labels) for analysis.
   - **Details:** Combines OCR and image recognition to convert visual information into analyzable text and features.

3. **Optical Character Recognition (OCR) (Green)**
   - **Purpose:** Converts text from images into machine-readable text.
   - **Details:** Extracts ingredient lists or other relevant data embedded within images.

4. **Natural Language Processing (NLP) (Green)**
   - **Purpose:** Analyzes textual data (from text input or OCR output) to identify potential allergens.
   - **Details:** Uses keyword matching, pattern recognition, and context analysis to detect allergen-related terms.

5. **Image Analysis (Green)**
   - **Purpose:** Processes visual data to identify food items or packaging that may indicate allergens.
   - **Details:** Uses computer vision techniques to recognize allergenic food types and features.

6. **Allergen Database (Red)**
   - **Purpose:** Stores a comprehensive list of allergens, their aliases, and severity levels.
   - **Details:** Serves as the central reference for both text and image processing modules, ensuring accurate allergen detection.

7. **Allergen Detection (Green)**
   - **Purpose:** Matches extracted text or identified features against the database to detect allergens.
   - **Details:** Returns findings such as allergen names, aliases, and confidence levels.

8. **Feedback Loop (Green)**
   - **Purpose:** Handles unclear or ambiguous inputs by requesting better data from users.
   - **Details:** Improves accuracy by guiding users to provide more precise inputs.

9. **Error Handling (Green)**
   - **Purpose:** Manages cases where inputs are invalid or inconclusive.
   - **Details:** Provides messages to users, asking for corrections or additional inputs.

10. **End User (Stick Figure)**
    - **Purpose:** Represents the individual interacting with the system, either inputting data or reviewing results.
    - **Details:** Could be a person with allergies, a caregiver, or anyone needing allergen information.

11. **Outputs (Gray)**
    - **Purpose:** Displays the final allergen report to the user.
    - **Details:** Includes detected allergens, confidence levels, aliases, and recommendations.

[Full Page](./Assignments/Senior%20Design%20I/Assignment4_Design_Diagrams/README.md)

---

## Project Tasks and Timeline

### Task List

#### Kaleb Bishop
- Contact Professor for Advisement
- Create App in Typescript
- Implement Web Scraper
- Design App
- Train Image Classification Model to Recognize Dishes from Images
- Ensure consistant performance regardless of platform
- Implement Camera Functionality into App

#### Matthew Bryant
- Build Recipes Database
- Populate Database and Rank Recipes
- Populate Allergens into Database
- Design Web Scraper
- Test Text Tokenizer Output Being Sent to Recipes Database
- Test NLP Model Output Being Sent to Recipes Database
- Test Recipes Database Making Web Scraping Requests

#### Eric Buffington
- Design and Implement Text Tokenizer
- Research Natural Language Processing Models
- Integrate NLP Model with Tokenizer
- Test Text Tokenizer Output Being Sent to Recipes Database
- Test NLP Model Output Being Sent to Recipes Database

#### Hung Nguyen
- Test Image Classification Model Output Being Sent to NLP Model
- Test Output on Typescript App Matching Proper Database Entry
- Test Recipes Database Returning Proper Allergen List
- Test Database Recipe data quality
- Design Allergen recipe detection model
- Integrate Allergen detection model with database
- Test App for performance, endurance and availability

[Full Page](./Assignments/Senior%20Design%20I/Assignment5_Task_Lists/)

### Timeline

| Task                                                            | Start Date       | End Date         | Milestone                               |
|------------------------------------------------------------------|------------------|------------------|-----------------------------------------|
| Contact Professor for Advisement                                 | September 25, 2024 | September 29, 2024 | Project Setup & Initial Consultation    |
| Design App                                                       | January 29, 2025 | February 5, 2025 | App Design Completion                   |
| Create App in TypeScript                                         | January 29, 2025 | March 5, 2025    | App Design Completion                   |
| Build Recipes Database                                           | February 1, 2025 | February 12, 2025 | Database Build & Populate               |
| Populate Database and Rank Recipes                               | February 5, 2025 | February 19, 2025 | Database Build & Populate               |
| Design Web Scraper                                               | October 1, 2024   | October 20, 2024 | Web Scraper and NLP Integration         |
| Implement Web Scraper                                            | October 6, 2024   | October 20, 2024 | Web Scraper and NLP Integration         |
| Design & Implement Text Tokenizer                                | February 1, 2025 | February 19, 2025 | Web Scraper and NLP Integration         |
| Research Natural Language Processing Models                      | February 1, 2025 | February 19, 2025 | Web Scraper and NLP Integration         |
| Integrate NLP Model with Tokenizer                               | February 5, 2025 | February 19, 2025 | Web Scraper and NLP Integration         |
| Test Text Tokenizer Output Sent to Recipes Database              | February 12, 2025 | February 26, 2025 | Model Training & Testing                |
| Test NLP Model Output Sent to Recipes Database                   | February 12, 2025 | February 26, 2025 | Model Training & Testing                |
| Train Image Classification Model to Recognize Dishes from Images | February 12, 2025 | February 26, 2025 | Model Training & Testing                |
| Test Image Classification Model Output Sent to NLP Model         | February 12, 2025 | February 26, 2025 | Model Training & Testing                |
| Test Recipes Database Making Web Scraping Requests               | February 19, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Test Output on TypeScript App Matching Proper Database Entry     | February 19, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Populate Allergens into Database                                 | February 12, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Design Allergen Recipe Detection Model                           | February 19, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Integrate Allergen Detection Model with Database                 | February 19, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Test Recipes Database Returning Proper Allergen List             | February 19, 2025 | March 5, 2025    | Allergen Detection Model Integration    |
| Implement Camera Functionality into App                          | February 19, 2025 | March 26, 2025   | Final Testing and Performance Optimization |
| Ensure Consistent Performance Across Platforms                   | February 19, 2025 | March 26, 2025   | Final Testing and Performance Optimization |
| Test App Performance, Endurance, and Availability                | March 5, 2025    | March 26, 2025   | Final Testing and Performance Optimization |
| Test Database Recipe Data Quality                                | March 5, 2025    | March 26, 2025   | Final Testing and Performance Optimization |

### Effort Matrix

| Task                                                            | Kaleb Bishop (%) | Matthew Bryant (%) | Eric Buffington (%) | Hung Nguyen (%) |
|------------------------------------------------------------------|------------------|--------------------|---------------------|-----------------|
| Contact Professor for Advisement                                 | 100              | 0                  | 0                   | 0               |
| Create App in TypeScript                                         | 80               | 0                  | 0                   | 20              |
| Implement Web Scraper                                            | 100              | 0                  | 0                   | 0               |
| Design App                                                       | 70               | 0                  | 0                   | 30              |
| Train Image Classification Model to Recognize Dishes from Images | 100              | 0                  | 0                   | 0               |
| Ensure Consistent Performance Across Platforms                   | 60               | 0                  | 0                   | 40              |
| Implement Camera Functionality into App                          | 80               | 0                  | 0                   | 20              |
| Build Recipes Database                                           | 0                | 100                | 0                   | 0               |
| Populate Database and Rank Recipes                               | 0                | 100                | 0                   | 0               |
| Populate Allergens into Database                                 | 0                | 100                | 0                   | 0               |
| Design Web Scraper                                               | 30               | 70                 | 0                   | 0               |
| Test Text Tokenizer Output Sent to Recipes Database              | 0                | 20                 | 40                  | 40              |
| Test NLP Model Output Sent to Recipes Database                   | 0                | 20                 | 40                  | 40              |
| Test Recipes Database Making Web Scraping Requests               | 0                | 40                 | 0                   | 60              |
| Design & Implement Text Tokenizer                                | 0                | 0                  | 100                 | 0               |
| Research Natural Language Processing Models                      | 0                | 0                  | 100                 | 0               |
| Integrate NLP Model with Tokenizer                               | 0                | 0                  | 100                 | 0               |
| Test Image Classification Model Output Sent to NLP Model         | 20               | 0                  | 0                   | 80              |
| Test Output on TypeScript App Matching Proper Database Entry     | 30               | 0                  | 0                   | 70              |
| Test Recipes Database Returning Proper Allergen List             | 0                | 30                 | 0                   | 70              |
| Design Allergen Recipe Detection Model                           | 0                | 0                  | 0                   | 100             |
| Integrate Allergen Detection Model with Database                 | 0                | 0                  | 0                   | 100             |
| Test App Performance, Endurance, and Availability                | 30               | 0                  | 0                   | 70              |
| Test Database Recipe Data Quality                                | 0                | 30                 | 0                   | 70              |

---

[Full Page](./Assignments/Senior%20Design%20I/Assignment6_Milestones_Timeline_Effort_Matrix/README.md)

---

## ABET Concerns Essay
Our project is focused on training an artificial intelligence to be able to identify potential allergens in text or images and integrating it into an accessible form.  One constraint that we see is our economics where we are operating with a very small budget. We must rely on open-source tools such as TensorFlow but costly datasets, tools and computational power are out of our reach. This project also has implications on our professional development in that it requires the specialized skills in the realm of computer science such as machine learning, NLP, image processing, and full stack development.  If our end product is unable to reliably deliver correct results, it will reflect on the reputation of each of us team members.  Security considerations will also be a constraint given the sensitivity of dietary information. We must ensure that all personal information is not tradable back to an individual, that all data transfers are confidential and that all data is stored securely. The largest constraint we have is health due to the impact of incorrect results. Posting a false negative could result in the user consuming an item that can harm them. Furthermore, a bad actor may falsify the data to make allergic recipies appear as non-allergic. Thus, transparency is our strongest tool in giving users as much information as possible to guide their choices.

[Full Page](./Assignments/Senior%20Design%20I/Assignment7_Project_Constraints_Essay/README.md)

---

## PPT Slideshow
[Link to PPT](./Assignments/Senior%20Design%20I/Assignment8_Slide_Show_Fall_Design_Presentations/slide_deck.pptx)

[Link to Video](./Assignments/Senior%20Design%20I/Assignment9_Presentation_Videos_and_Peer_Review_Assessments/slide_deck.mp4)

---

## Professional Biographies

### Kaleb Bishop
[Kaleb Bishop Biography (bishopkw)](./Assignments/Senior%20Design%20I/Assignment1_Professional_Biography/Bishopkw.md)

#### Contact Information
- **Location:** Findlay, OH
- **Phone:** (419) 672-9019
- **Email:** [bishopkw@mail.uc.edu](mailto:bishopkw@mail.uc.edu)
- **LinkedIn:** [www.linkedin.com/in/kalebwbishop](https://www.linkedin.com/in/kalebwbishop)
- **GitHub:** [www.github.com/kalebwbishop](https://www.github.com/kalebwbishop)

#### Co-op or Other Experience and Responsibilities
   **Founder, Developer | Eagle Drive | June 2024 – Present**
   - **Technical Skills:**
      - .NET API, Auth0, OAuth 2.0, React Expo, TypeScript
   - **Non-Technical Skills:**
      - Project Management, User Authentication, Real-Time Event Handling
   - **Responsibilities:**
      - Integrated a .NET API using Auth0 and OAuth 2.0 to enhance security and user authentication.
      - Designed and developed a frontend application that manages real-time events like tee time bookings.

   **Founder, Developer | Motiv | October 2023 – June 2024**
   - **Technical Skills:**
      - Full-Stack Development, Mobile Application Development, Azure DevOps
   - **Non-Technical Skills:**
      - Team Leadership, Agile Practices, Pitch Competitions
   - **Responsibilities:**
      - Developed a full-stack mobile application for real-time communication and user engagement.
      - Led a team of developers using agile methodologies, ensuring consistent workflow and project milestones.

   **Developer Co-op | Midmark | August 2022 – May 2024**
   - **Technical Skills:**
      - Frontend Development, Notifications Engine, Automated Testing
   - **Non-Technical Skills:**
      - User Experience Improvement, Continuous Integration, Team Collaboration
   - **Responsibilities:**
      - Built a user-friendly frontend and improved a notifications engine to enhance user engagement.
      - Created automated test scripts to support seamless continuous development and integration.

   **Developer | 3D Creations | August 2023 – Present**
   - **Technical Skills:** Python, JavaScript, HTML & CSS
   - **Responsibilities:**
      - Building a website to provide University students with affordable Blender modeling resources.

   **Developer | Video Game Automation | February 2022 – August 2023**
   - **Technical Skills:** Python
   - **Responsibilities:**
      - Developed scripts to automate gameplay for personal goals, exploring concepts like machine vision, data management, and multiprocessing.

#### Skills/Expertise Areas
   - Programming: C#, C++, Java, .NET, TypeScript, Python, JavaScript
   - Operating Systems: Unix, Linux, Windows
   - Web Development: React Expo, HTML, CSS
   - Database Programming: SQL
   - Office Applications: Mathematica, MatLab, Microsoft Office 2003 & 2007

#### Areas of Interest
   - Full-Stack Development
   - Cloud Computing
   - Database Applications
   - Artificial Intelligence
   - Real-Time Applications

#### Type of Project Sought
   - Seeking a capstone project that leverages full-stack development skills, particularly in real-time applications, user authentication, and mobile or  web-based platforms. Ideal projects would involve emerging technologies and collaboration with a cross-functional team, allowing the application of project management and agile practices.


### Matthew Bryant
[Matthew Bryant Biography (bryantmw)](./Assignments/Senior%20Design%20I/Assignment1_Professional_Biography/bryantmw.md)

#### Contact Information
- **Email:** bryantmw@mail.uc.edu

#### Co-op and other experience

**Developer, SolutionLink software at Siemens AG for 4 semesters**
- Worked closely with a large development team across multiple time zones and continents to develop and test new features with a daily meeting to report progress updates and communicate issues
- Wrote hundreds of test cases using Gherkin in C#
- Read through and diagnosed issues with webpages running HTML/CSS/JavaScript

**Previously was an IT Major**
- The IT curriculum focused on Java and Web Development, so I have much more experience with those than the average Computer Science student

#### Skills/Expertise Areas

- Compiled and Interpreted Languages: C/C++/C#, x86 Assembly, Java, Python, Haskell
- Web Development: HTML/CSS/JavaScript, experience with Java and Python Networking sockets
- Database Experience: Two semesters practicing SQL

#### Areas of Interest

- Systems Programming
- 3D Rendering such as with OpenGL
- User facing applications

#### Type of Project Sought

- I am very flexible on what project I do. I don't want it to be something "easy" or that I already know how to do. This is an opportunity to work on a new skill that would be difficult to teach myself with an advisor to oversee the project. Below are some things I've considered that might be interesting
- 3D Rendering, Smartphone/Desktop app with a professional quality UI, useful Linux module, usable website, Audio Encoding, Systems Programming project to develop a physical tool

### Hung Nguyen
[Hung Nguyen Biography (nguye3hv)](./Assignments/Senior%20Design%20I/Assignment1_Professional_Biography/nguye3hv.md)

#### Contact Information
- **Email:** nguye3hv@mail.uc.edu
- **Phone:** (513) 501-5090

#### Work Experience

**Logistics Co-op, Cummins Inc, Florence, KY | Aug 2023 - Aug 2024**
- Utilize Data Analytics and business intelligence tools (Qlik, PowerBI, Tableau) for analyzing freight data, conducting monthly reporting, collaborating on continuous improvement.
- Supporting Florence Traffic team in standardizing freight management procedures and daily tasks
- Technical Skills: VBA, Excel, PowerBI, Access SQL, Blue Yonder, Qlik, IBM AS400
- Non-Technical Skills: Communication, Teamwork, Problem Solving

**Project Manager Co-op, EMCOR Facilities Services, Cincinnati, OH | Jan 2023 – Apr 2023**
- Assist project managers with documentation for project close-outs
- Maintain work orders using management systems
- Technical Skills: Microsoft Office, VBA, PowerBi, Smartsheet
- Non-Technical Skills: Communication, Time management, Conflict Resolution

**Data Engineer Intern, SVTECH Company, Hanoi, Vietnam | May 2022 – Aug 2022**
- Write SQL scripts to query data from company databases
- Build scripts to extract, transform, and load data from several databases to another using the DataStage tool
- Technical Skills: DataStage, DB2 SQL, Excel, Netezza SQL, Data pipeline
- Non-Technical Skills: Communication, Problem Solving, Cooperation

#### Project types sought

- A web application that allows users to see nearby discounts/offers at local restaurants
- A computerized treatment for depression that integrates psychological therapy techniques with relationship guidance and accountability.
- Using deep learning methods (particularly the diffusion probabilistic model) to perform PET image ASC without the CT scan
- Using self-supervised deep learning methods (specifically the deep image prior) to reduce noise and improve accuracy for low dose brain PET images
- A variation of the normal chess game with with added squares to swap chess piece type.

### Eric Buffington
[Eric Buffington Biography (buffinea)](./Assignments/Senior%20Design%20I/Assignment1_Professional_Biography/buffinea.docx)

#### Contact Information
- **Email:** ericbuff73@gmail.com
- **Phone:** 513-882-6460

#### Co-Op/Work Experience

**Software Developer - Honeywell Intelligrated, Mason, Ohio | January 22 – April 22 | August 22 – December 22**
- Completed 5 projects with teams, over 2 Co-Op semesters, all of which were presented to management
- Developed python programs to ensure data communication between PLC and UI was correct
- Presented an efficiency report on new PLC program the company was going to implement nationwide
- Worked along with senior engineers to implement 2 programs which are currently in use

**Software Developer - SHP, Cincinnati, Ohio | January 7 - August 2**
- Worked in C# to develop buttons for architects, or other engineers
- Created, or contributed to bug fixes on 55+ buttons
- Worked along with electrical engineers to develop tool to automatically name circuits throughout a building
- Tested new abstract class for making tree views by implementing fully working button to test for duplicate items in a model

#### Skills/Expertise

- Programming Languages: C#, C++, Python, & Java
- Operating System: Windows and Linux
- Scripting Languages: XML, XAML, & HTML
- Database: SQL
- Others: Mathematics, Learning Probabilistic Models, MatLab, Visual Basics, and Julia

#### Area of Interest

- Artificial Intelligence
- Sports
- Web Application
- Data Analysis

#### Type of Project Sought

- Generative AI that can assess current players on field, down & distance, time in game, and other factors and return a predicted play with a confidence level
- Web application to gather current stats of a team, and return with list of areas where they are excelling compared to league, or lacking
Assessment of how effective the new guardian caps are at avoiding injured in NFL

---

## Budget

### Expenses to Date

- $0.12 Used for the ChatGPT api, this was used to classify recipies into categories. For example Caramelized Onion and Roasted Garlic Pasta would fall into th pasta category.

Future expenses may include hosing costs for our API and database.

### Donated Items and Sources

No donated items or sources as of now.

---

## Test Plan and Results
[Test Plan and Results](./Assignments/Senior%20Design%20II/Assignment_1_Test_Plan/Assignment%20.pdf)

## User Manual
[User Manual](./Assignments/Senior%20Design%20II/Assignment_2_User_Docs/Assignment.md)

## Spring Final PPT Presentation
[Spring Final PPT Presentation](./Assignments/Senior%20Design%20II/Assignment_3_Presentation_Slidedeck/Qsine_Slidedeck_2.pptx)

## Final Expo Poster
[Final Expo Poster](./Assignments/Senior%20Design%20II/Assignment_4_Expo_Poster/SD_Poster.pdf)

## Summary of Expenses & Hours and Justification
| Name             | Expenses  | Semester 1 Hours | Semester 2 Hours | Total Hours |
|------------------|-----------|------------------|------------------|-------------|
| Kaleb Bishop     | $117.50   | 25               | 95               | 120         |
| Eric Buffington  | $95.00    | 35               | 58               | 93          |
| Hung Nguyen      | $7.56     | 35               | 82               | 117         |
| Matthew Bryant   | $0.00     | 48               | 53               | 101         |
| **Total**        | **$220.06**| **143**          | **288**          | **431**     |

[Justification](./Assignments/Senior%20Design%20II/Assignment_7_Final_Design_Report/Summary%20of%20Hours%20&%20Expenses.pdf)


---

## Appendix

### Code Repositories

[Qsine application code](./Qsine)


### Meeting Notes

**September Meeting:** Discussed potential topics such as a digitized game book or fantasy football website before eventually settling on QSine. Determined who would work on which part of the project.

### Contributions

#### Kaleb Bishop
- Created a draft frontend in react native, able to take in both text and image inputs.
- Designed and implemented a breadth first search web scraper for Allrecipies.com. This allows us to get large amounts of text data paired with image data. We can then use this data for our AI.
- Used the ChatGPT api in order to classify different images into categories.

#### Hung Nguyen
- Trained the Stanford Named Entity Recognition model to parse the ingrendient list data for into a list of tokenized ingredients
- Created a designed an allergen detection model by using a trained Stanford Named Entity Recognition model to parse the lists of results before querying the most likely allergy of each ingredient using a Bag of Word search model
- Manually tag and label data from Allrecipies.com for model training
- Created a dataset containing common allergens using online sources such as AllergenOnline, Kaggle and FARRP.

#### Matthew Bryant
- Has begun development on database; will be committed early 2025 once it's functional
- Writing on various assignments

### Eric Buffington
- Preparing NLP model by doing more and more complex test progessively
- Worked with multiple tokenizers to find which works with ny NLP model the best
- Began testing the tokenizer and NLP working together at a simple level, preparing for full scale testing before implementation 
---
