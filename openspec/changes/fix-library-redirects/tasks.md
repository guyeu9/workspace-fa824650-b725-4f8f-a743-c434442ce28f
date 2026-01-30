# Tasks: Fix Game Library Redirects & Complete Library Validation

## 1. Code Fixes
- [ ] **Task 1.1**: Update `handleNewGame` in `src/app/game-library/page.tsx` to redirect to `/` instead of `/studio`.
    - *Verification*: Click "新游戏" button and ensure it navigates to the game player at `http://localhost:3000/`.

## 2. Library Functional Verification
- [ ] **Task 2.1**: **Verify Edit Jump**
    - Click "编辑" on "Legacy_Test_Project".
    - *Verification*: Ensure it navigates to `http://localhost:3000/studio` and loads the correct game data.
- [ ] **Task 2.2**: **Verify Play Flow (New Game)**
    - Navigate back to library.
    - Click "开始游戏" or "新游戏" on "Legacy_Test_Project".
    - *Verification*: Ensure it navigates to `http://localhost:3000/`, shows "Start Content", and "Go to Next" option works.
- [ ] **Task 2.3**: **Verify List Management**
    - Test searching for "Legacy".
    - Test sorting by "Title" or "Priority".
    - *Verification*: List updates correctly based on UI interactions.
