"""Initial load from PDF

Revision ID: 003
Revises: a33ebf9b1982
Create Date: 2025-11-17 00:36:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import re
from datetime import datetime
from pathlib import Path

revision: str = '003'
down_revision: Union[str, None] = 'a33ebf9b1982'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def parse_text_content(text_content):
    """Парсинг текстового содержимого из конвертированного PDF"""
    deadlines = []
    
    
    lines = text_content.split('\n')
    current_report = None
    i = 0
    main_reports = [
        'Расчет 6-НДФЛ', 'РСВ', 'Персонифицированные сведения о физлицах',
        'Декларация по налогу на прибыль', 'Декларация по НДС',
        'Журнал учета полученных и выставленных счетов-фактур',
        'Декларация по налогу при УСН', 'Декларация по ЕСХН',
        'Декларация по налогу на имущество организаций',
        'Декларация по форме 3-НДФЛ', 'Декларация по НДС (импорт из ЕАЭС)',
        'ЕФС-1', 'Подтверждение основного вида деятельности',
        'Бухгалтерская отчётность'
    ]
    
    while i < len(lines):
        line = lines[i].strip()
        
        if not line or '===' in line or 'Сроки сдачи' in line:
            i += 1
            continue
        
        for report in main_reports:
            if report in line:
                current_report = report
                break
        
        if current_report:
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                
                if not next_line:
                    continue
                
                if 'За' in next_line:
                    period_line = next_line
                    
                    date_matches = re.findall(r'\d{2}\.\d{2}\.\d{4}', period_line)
                    
                    if not date_matches and j+1 < len(lines):
                        next_next_line = lines[j+1].strip()
                        date_matches = re.findall(r'\d{2}\.\d{2}\.\d{4}', next_next_line)
                        if date_matches:
                            period_line += " " + next_next_line
                    
                    if date_matches:
                        deadline_str = date_matches[0]
                        deadline_date = datetime.strptime(deadline_str, '%d.%m.%Y').date()
                        
                        if any(x in current_report for x in ['НДФЛ', 'сведения', 'персонифицированные', 'бухгалтерская']):
                            report_type = 'отчетность'
                        elif any(x in current_report for x in ['НДС', 'прибыль', 'УСН', 'ЕСХН', 'имущество']):
                            report_type = 'налог'
                        elif any(x in current_report for x in ['РСВ', 'ЕФС', 'взносы', 'страхование']):
                            report_type = 'взносы'
                        else:
                            report_type = 'отчетность'
                        
                        if any(x in current_report for x in ['НДС', '6-НДФЛ', 'прибыль', 'УСН']):
                            importance = 'high'
                        else:
                            importance = 'medium'
                        
                        title = f"{current_report}"
                        
                        period_clean = re.sub(r'\d{2}\.\d{2}\.\d{4}', '', period_line).strip()
                        if period_clean:
                            title += f" {period_clean}"
                        
                        authority = 'ИФНС' if report_type in ['налог', 'отчетность'] else 'СФР'
                        
                        deadline = {
                            'deadline_date': deadline_date,
                            'title': title.strip(),
                            'report_type': report_type,
                            'importance': importance,
                            'period_description': period_clean,
                            'authority': authority,
                            'report_year': deadline_date.year
                        }
                        
                        deadlines.append(deadline)
        i += 1
    
    return deadlines


def upgrade():
    op.create_table('tax_deadlines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('deadline_date', sa.Date(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('report_type', sa.String(), nullable=False),
        sa.Column('importance', sa.String(), nullable=False),
        sa.Column('period_description', sa.String(), nullable=True),
        sa.Column('authority', sa.String(), nullable=True),
        sa.Column('report_year', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('ix_tax_deadlines_deadline_date', 'tax_deadlines', ['deadline_date'])
    txt_path = Path(__file__).parent.parent / 'kalendar2025.txt'
    
    with open(txt_path, 'r', encoding='utf-8') as f:
        text_content = f.read()
        
        
    deadlines_data = parse_text_content(text_content)
        
    tax_deadlines_table = sa.table('tax_deadlines',
        sa.column('deadline_date', sa.Date),
        sa.column('title', sa.String),
        sa.column('report_type', sa.String),
        sa.column('importance', sa.String),
        sa.column('period_description', sa.String),
        sa.column('authority', sa.String),
        sa.column('report_year', sa.Integer),
    )
            
    values = []
    for data in deadlines_data:
        values.append({
            'deadline_date': data['deadline_date'],
            'title': data['title'],
            'report_type': data['report_type'],
            'importance': data['importance'],
            'period_description': data['period_description'],
            'authority': data['authority'],
            'report_year': data['report_year'],
        })
    
    op.bulk_insert(tax_deadlines_table, values)


def downgrade():
    op.drop_index('ix_tax_deadlines_deadline_date', table_name='tax_deadlines')
    op.drop_table('tax_deadlines')