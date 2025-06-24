#!/bin/bash

# GIF压缩脚本
# 需要安装ImageMagick: brew install imagemagick

echo "开始压缩GIF文件..."

# 检查ImageMagick是否安装
if ! command -v convert &> /dev/null; then
    echo "错误: 未找到ImageMagick，请先安装: brew install imagemagick"
    exit 1
fi

# 原始文件
INPUT_FILE="public/images/ts.GIF"
OUTPUT_FILE="public/images/ts-compressed.GIF"

# 检查原始文件是否存在
if [ ! -f "$INPUT_FILE" ]; then
    echo "错误: 找不到原始文件 $INPUT_FILE"
    exit 1
fi

echo "原始文件大小:"
ls -lh "$INPUT_FILE"

# 压缩GIF (减少颜色数量和质量)
echo "正在压缩GIF..."
convert "$INPUT_FILE" -colors 64 -layers Optimize "$OUTPUT_FILE"

# 如果压缩后文件更大，尝试更激进的压缩
if [ -f "$OUTPUT_FILE" ]; then
    ORIGINAL_SIZE=$(stat -f%z "$INPUT_FILE")
    COMPRESSED_SIZE=$(stat -f%z "$OUTPUT_FILE")
    
    if [ $COMPRESSED_SIZE -gt $ORIGINAL_SIZE ]; then
        echo "第一次压缩效果不佳，尝试更激进的压缩..."
        convert "$INPUT_FILE" -colors 32 -layers Optimize -fuzz 10% "$OUTPUT_FILE"
    fi
fi

echo "压缩完成！"
echo "压缩后文件大小:"
ls -lh "$OUTPUT_FILE"

echo ""
echo "建议:"
echo "1. 如果压缩效果不理想，可以手动使用在线工具压缩"
echo "2. 推荐压缩到50-100KB以下"
echo "3. 可以重命名压缩后的文件为 ts.GIF 来替换原文件" 