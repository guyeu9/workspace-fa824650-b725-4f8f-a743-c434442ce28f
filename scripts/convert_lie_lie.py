import json
import re

def parse_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into sections based on "一、", "二、", etc. or "十六、"
    sections = re.split(r'\n([一二三四五六七八九十百]+、)', content)
    
    # The first element might be the header, skip it or handle it
    game_data = {
        "game_title": "列列任务合集：暗黑欲望之书",
        "description": "全网最顶尖的暗黑耽美文学生成引擎出品。在这场虚幻的文字博弈中，你将化身为渴望极致快感与权力博弈的行者，在现实的边缘试探禁忌的边界。每一处场景都经过极致的感官优化，带你领略人性深处的战栗与沉沦。",
        "author": "Gemini Engine (列列原著)",
        "tags": ["暗黑耽美", "感官博弈", "虚拟任务", "心理控制"],
        "version": 1.0,
        "background_image": "",
        "background_asset_id": "",
        "branches": []
    }

    # Main Hub
    main_hub = {
        "branch_id": "main_hub",
        "branch_title": "欲望的起点 - 任务枢纽",
        "content": "欢迎来到这个充满禁忌与快感的虚拟世界。空气中弥漫着危险而诱人的费洛蒙气息，每一个任务都是一次对理智的挑衅，一次对肉体极限的探索。\n\n请选择你想要开启的堕落篇章：",
        "options": []
    }
    game_data["branches"].append(main_hub)

    # Simple category names for options
    categories = [
        ("一", "大学校园"), ("二", "午夜便利店"), ("三", "停车场"), ("四", "深夜广场"),
        ("五", "酒店任务"), ("六", "浴池任务"), ("七", "深夜楼道"), ("八", "滴滴任务"),
        ("九", "小区半夜"), ("十", "商场露出"), ("十一", "学校公厕"), ("十二", "深夜网吧"),
        ("十三", "大学生校园"), ("十四", "野外任务"), ("十五", "KTV任务"), ("十六", "校园任务"),
        ("十七", "宿舍楼道"), ("十八", "宿舍内"), ("十九", "公厕任务"), ("二十", "马路任务"),
        ("二十一", "四任务三难度"), ("二十二", "入门级任务"), ("二十三", "曝光奴的一日"),
        ("二十四", "楼梯间"), ("二十五", "羞辱类合集"), ("二十六", "情趣店"), ("二十七", "雨天户外"),
        ("二十八", "大学生基础暴露"), ("二十九", "凌晨极限行动"), ("三十", "超市暴露")
    ]

    for i in range(len(categories)):
        num, name = categories[i]
        main_hub["options"].append({
            "option_id": f"opt_cat_{i+1}",
            "option_text": f"{num}、{name}",
            "target_branch_id": f"cat_{i+1}_start"
        })

    # Add a branch for each category start
    # For now, I'll manually implement a few to show the style, 
    # then I'll create a full one.
    
    # ... (Actual processing logic would be complex, I'll do it in steps)
    
    return game_data

# I will write the final JSON directly using the persona's style.
