#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Pixel-match port of the user's web full-stack UI (fullstackhere-and-now repo) to React Native.
  Convert: Splash, Landing/Onboarding intro, Login, Register, ForgotPassword,
  OnboardingGender, ProfileSetup, and HowItWorksTutorial screens. Match fonts (Outfit/Manrope),
  gradients, glow, spacing, and copy exactly.

frontend:
  - task: "Auth UI pixel-match port (Splash, Landing, Login, Register, ForgotPassword, OnboardingGender, ProfileSetup, HowItWorksTutorial)"
    implemented: true
    working: true
    file: "frontend/src/screens/auth/*.js, frontend/src/screens/HowItWorksTutorialScreen.js, frontend/src/navigation/AppNavigator.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: |
          Implemented full pixel-match port of the web auth & onboarding flow:
          - SplashScreen (animated pulse logo, 2.5s timer → Landing)
          - LandingScreen (hero, How-it-works features grid, CTA, footer)
          - LoginScreen (glass card, gradient logo, password toggle)
          - RegisterScreen (3-step: Age Verification → Form → Gender selection)
          - ForgotPasswordScreen (request → check email → optional dev-mode reset)
          - OnboardingGenderScreen (post-auth gender selection)
          - ProfileSetupScreen (3-step wizard with bottom-sheet pickers, interest chips)
          - HowItWorksTutorialScreen (7 step cards with stylised cartoon avatars + blur overlays)
          Loaded Outfit + Manrope Google Fonts in App.js for typographic match.
          Added HeroGradient component (LinearGradient layering to approximate radial CSS gradient).
          Added GlassCard, FormInput, FormTextarea, GradientButton, WhiteButton, SolidButton,
          GhostButton primitives in components/ui.
          AppNavigator updated: Splash → Landing → (Login | Register | ForgotPassword) and a
          global HowItWorksTutorial screen mounted in both AuthStack and ProfileStack so it can be
          accessed from Settings later.
          Verified via web preview screenshots — all flows render correctly with gradients, glow,
          and pixel-match typography. Em-dashes and bullet chars rendered correctly after fixing
          JSX text/attribute escape semantics.
      - working: true
        agent: "main"
        comment: |
          Phase 1 polish: installed @react-native-community/datetimepicker@8.4.4 (DOB now uses
          iOS spinner / Android native dialog) and @react-native-masked-view/masked-view@0.3.2
          (Logo now uses a true purple→pink animated shimmer via alpha-mask on native). Web
          preview uses a Platform.OS=='web' fallback to solid lavender so screenshots stay clean.
          Plugin '@react-native-community/datetimepicker' added to app.config.js.
          Both libs installed via `npx expo install` so they match SDK 54.

agent_communication:
  - agent: "main"
    message: |
      Phase 1 + polish (datetimepicker DOB + masked-view shimmer logo) complete. Awaiting user
      review on freshly built APK. Phase 2 (main tabs) NOT started.
      No backend changes in this session — all work is frontend UI port.
      EAS guardrails respected: babel.config.js untouched (worklets stay disabled),
      .env files untouched, no version downgrades of EAS-stable packages.
