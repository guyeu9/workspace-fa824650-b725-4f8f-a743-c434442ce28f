# Tasks: Comprehensive Game Editor Testing

## 1. Environment Setup & Cleanup
- [ ] **Task 1.1**: Create a Playwright utility to clear IndexedDB and SessionStorage before test runs to ensure a clean state.
- [ ] **Task 1.2**: Verify application is running and accessible at `http://localhost:3000`.

## 2. Legacy Editor Validation (`/game-editor`)
- [ ] **Task 2.1**: **Create Game Flow**
    - Navigate to `/game-editor`.
    - Input Game Title: "Legacy_Test_Project".
    - Input Description: "A test project created in legacy editor".
    - Create a Start Branch ("Chapter 1") with content "Start Content".
    - Create a Second Branch ("Chapter 2") with content "End Content".
    - Add Option to Chapter 1: "Go to Next", target -> "Chapter 2".
- [ ] **Task 2.2**: **Save & Persistence**
    - Click "Save to Library".
    - Verify Success Toast appears.
    - Verify data is stored in `gameStore` (IndexedDB).

## 3. Game Library Integration (`/`)
- [ ] **Task 3.1**: **List Verification**
    - Navigate to Home `/`.
    - Verify "Legacy_Test_Project" appears in the game list.
- [ ] **Task 3.2**: **Play Mode**
    - Click "Start Game" on "Legacy_Test_Project".
    - Verify redirection to play mode.
    - Click option "Go to Next".
    - Verify transition to "Chapter 2".
- [ ] **Task 3.3**: **Edit Mode Routing**
    - Navigate back to Home.
    - Click "Edit" on "Legacy_Test_Project".
    - Verify redirection back to `/game-editor` (or Studio if configured to upgrade, currently legacy stays legacy).
    - Verify data loaded correctly (Title, Branches).

## 4. Studio Editor & Compatibility (`/studio`)
- [ ] **Task 4.1**: **Legacy Data Compatibility**
    - *Prerequisite*: Fix implemented in `normalizeGameData` (Done).
    - Navigate to `/studio`.
    - Mock loading "Legacy_Test_Project" data into Studio (or use Import feature if available, otherwise verify via session/local storage injection).
    - **Verify**: Data loads without crashing (Testing the `undefined` fix).
    - **Verify**: "Chapter 1" (legacy) maps to "Branch Title".
    - **Verify**: Options appear correctly.
- [ ] **Task 4.2**: **New Feature: State Management**
    - Create a new variable "Health" = 100.
    - Add an option effect "Health - 10".
    - Verify UI updates reflecting the variable.
- [ ] **Task 4.3**: **New Feature: Complex Branching**
    - Add a new branch "Forest".
    - Use the visual editor/list to link "Chapter 2" to "Forest".
    - Verify graph or list updates.

## 5. End-to-End Workflow (The "Golden Path")
- [ ] **Task 5.1**: Execute the full flow: Legacy Create -> Library Check -> Studio Edit -> Play Verification.
