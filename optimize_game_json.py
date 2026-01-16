import json
import re
from typing import Dict, List, Any

def parse_status_update(status_update: str) -> List[Dict[str, Any]]:
    if not status_update or status_update.strip() == "":
        return []
    
    status_changes = []
    
    pattern = r'(\w+)([+\-]?\s*)(\d+)%?'
    matches = re.findall(pattern, status_update)
    
    for match in matches:
        state_name = match[0]
        operation = match[1] or '+'
        value = int(match[2])
        
        state_id_map = {
            '暴露度': 'exposure',
            '羞耻感': 'shame',
            '兴奋度': 'excitement',
            '任务完成数': 'completed_tasks',
            '场景解锁数': 'unlocked_scenes'
        }
        
        state_id = state_id_map.get(state_name, state_name)
        
        status_changes.append({
            'state_id': state_id,
            'operation': 'add' if operation == '+' else 'subtract',
            'value': value
        })
    
    return status_changes

def optimize_json_file(input_path: str, output_path: str):
    print(f"Reading file: {input_path}")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Original file contains {len(data.get('branches', []))} branches")
    
    if 'game_states' not in data:
        data['game_states'] = [
            {
                'state_id': 'exposure',
                'name': '暴露度',
                'initial_value': 0,
                'min_value': 0,
                'max_value': 100,
                'display_format': 'percentage'
            },
            {
                'state_id': 'shame',
                'name': '羞耻感',
                'initial_value': 0,
                'min_value': 0,
                'max_value': 100,
                'display_format': 'percentage'
            },
            {
                'state_id': 'excitement',
                'name': '兴奋度',
                'initial_value': 0,
                'min_value': 0,
                'max_value': 100,
                'display_format': 'percentage'
            },
            {
                'state_id': 'completed_tasks',
                'name': '任务完成数',
                'initial_value': 0,
                'min_value': 0,
                'max_value': 53,
                'display_format': 'integer'
            },
            {
                'state_id': 'unlocked_scenes',
                'name': '场景解锁数',
                'initial_value': 0,
                'min_value': 0,
                'max_value': 53,
                'display_format': 'integer'
            }
        ]
        print("Added game_states array")
    
    if 'status' in data:
        del data['status']
        print("Removed old status field")
    
    branches = data.get('branches', [])
    optimized_branches = []
    
    field_mapping = {
        'chapter': 'branch_title',
        'scene_detail': 'content',
        'choices': 'options',
        'id': 'option_id',
        'choice': 'option_text',
        'next_branch': 'target_branch_id'
    }
    
    for branch in branches:
        optimized_branch = {}
        
        for key, value in branch.items():
            optimized_branch[key] = value
        
        for old_name, new_name in field_mapping.items():
            if old_name in optimized_branch:
                optimized_branch[new_name] = optimized_branch[old_name]
                del optimized_branch[old_name]
        
        if 'options' in optimized_branch:
            options = optimized_branch['options']
            optimized_options = []
            
            for option in options:
                optimized_option = {}
                
                for key, value in option.items():
                    optimized_option[key] = value
                
                for old_name, new_name in field_mapping.items():
                    if old_name in optimized_option:
                        optimized_option[new_name] = optimized_option[old_name]
                        del optimized_option[old_name]
                
                if 'status_update' in optimized_option:
                    status_changes = parse_status_update(optimized_option['status_update'])
                    if status_changes:
                        optimized_option['status_changes'] = status_changes
                    del optimized_option['status_update']
                
                optimized_options.append(optimized_option)
            
            optimized_branch['options'] = optimized_options
        
        optimized_branches.append(optimized_branch)
    
    data['branches'] = optimized_branches
    print(f"Optimization complete, processed {len(optimized_branches)} branches")
    
    print(f"Saving file to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("Optimization complete!")
    
    print("\n=== Optimization Statistics ===")
    print(f"Total branches: {len(optimized_branches)}")
    print(f"Total options: {sum(len(b.get('options', [])) for b in optimized_branches)}")
    print(f"Added game_states: Yes (5 states)")
    print(f"Field names updated: Yes")

if __name__ == '__main__':
    input_file = r'c:\Users\86156\Downloads\workspace-fa824650-b725-4f8f-a743-c434442ce28f\public\网调任务合集-完整版-v2.json'
    output_file = r'c:\Users\86156\Downloads\workspace-fa824650-b725-4f8f-a743-c434442ce28f\public\网调任务合集-完整版-v3.json'
    
    optimize_json_file(input_file, output_file)
