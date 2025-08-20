#!/usr/bin/env python3
"""
JobSpy Integration Script for AutoJobr
Scrapes jobs using JobSpy and saves them to PostgreSQL database
"""

import os
import sys
import json
import psycopg2
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import traceback

# Import JobSpy
try:
    from jobspy import scrape_jobs
except ImportError:
    print("Error: jobspy not found. Please install: pip install python-jobspy")
    sys.exit(1)

class JobSpyIntegration:
    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable not set")
    
    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    def categorize_job(self, title: str, skills: List[str]) -> tuple:
        """Categorize job based on title and skills"""
        title_lower = title.lower()
        skills_str = ' '.join(skills).lower() if skills else ''
        
        # Categories and subcategories mapping
        if any(keyword in title_lower for keyword in ['engineer', 'developer', 'programmer', 'software']):
            if 'frontend' in title_lower or 'front-end' in title_lower or any(skill in skills_str for skill in ['react', 'vue', 'angular']):
                return 'tech', 'frontend'
            elif 'backend' in title_lower or 'back-end' in title_lower:
                return 'tech', 'backend'
            elif 'full stack' in title_lower or 'fullstack' in title_lower:
                return 'tech', 'fullstack'
            elif 'devops' in title_lower or 'site reliability' in title_lower:
                return 'tech', 'devops'
            elif 'mobile' in title_lower or any(skill in skills_str for skill in ['ios', 'android', 'react native', 'flutter']):
                return 'tech', 'mobile'
            else:
                return 'tech', 'software-engineering'
        
        elif any(keyword in title_lower for keyword in ['data scientist', 'data engineer', 'data analyst', 'machine learning', 'ai engineer']):
            if 'scientist' in title_lower:
                return 'tech', 'data-science'
            elif 'engineer' in title_lower:
                return 'tech', 'data-engineering'
            else:
                return 'tech', 'data-analytics'
        
        elif any(keyword in title_lower for keyword in ['designer', 'ux', 'ui', 'design']):
            if 'ux' in title_lower or 'user experience' in title_lower:
                return 'design', 'ux'
            elif 'ui' in title_lower or 'user interface' in title_lower:
                return 'design', 'ui'
            elif 'product design' in title_lower:
                return 'design', 'product-design'
            else:
                return 'design', 'visual-design'
        
        elif any(keyword in title_lower for keyword in ['product manager', 'pm', 'product owner']):
            return 'product', 'product-management'
        
        elif any(keyword in title_lower for keyword in ['marketing', 'growth', 'content', 'social media']):
            return 'marketing', 'digital-marketing'
        
        elif any(keyword in title_lower for keyword in ['sales', 'account manager', 'business development']):
            return 'sales', 'business-development'
        
        else:
            return 'general', 'other'
    
    def determine_experience_level(self, title: str, description: str = '') -> str:
        """Determine experience level from title and description"""
        text = f"{title} {description}".lower()
        
        if any(keyword in text for keyword in ['senior', 'sr.', 'lead', 'principal', 'staff', 'architect']):
            return 'senior'
        elif any(keyword in text for keyword in ['junior', 'jr.', 'entry', 'entry-level', 'graduate', 'intern']):
            return 'entry'
        elif any(keyword in text for keyword in ['mid', 'mid-level', 'intermediate']):
            return 'mid'
        else:
            # Default to mid-level if not specified
            return 'mid'
    
    def clean_salary(self, salary_min: Optional[float], salary_max: Optional[float]) -> Optional[str]:
        """Clean and format salary range"""
        try:
            if salary_min is not None and not pd.isna(salary_min) and salary_min > 0:
                salary_min = int(float(salary_min))
            else:
                salary_min = None
                
            if salary_max is not None and not pd.isna(salary_max) and salary_max > 0:
                salary_max = int(float(salary_max))
            else:
                salary_max = None
                
            if salary_min and salary_max:
                return f"${salary_min:,} - ${salary_max:,}"
            elif salary_min:
                return f"${salary_min:,}+"
            elif salary_max:
                return f"Up to ${salary_max:,}"
            return None
        except (ValueError, TypeError, OverflowError):
            return None
    
    def extract_skills(self, title: str, description: str) -> List[str]:
        """Extract skills from job title and description"""
        # Common tech skills to look for
        common_skills = [
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux', 'SQL', 'NoSQL',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ',
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'AI',
            'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision', 'Framer',
            'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Slack', 'Notion'
        ]
        
        text = f"{title} {description}".lower()
        found_skills = []
        
        for skill in common_skills:
            if skill.lower() in text:
                found_skills.append(skill)
        
        return found_skills[:10]  # Limit to top 10 skills
    
    def scrape_jobs_jobspy(
        self, 
        search_terms: List[str] = None, 
        locations: List[str] = None,
        job_sites: List[str] = None,
        results_wanted: int = 50,
        country: str = 'USA'
    ) -> List[Dict[str, Any]]:
        """
        Scrape jobs using JobSpy
        
        Args:
            search_terms: List of job search terms (e.g., ['software engineer', 'python developer'])
            locations: List of locations (e.g., ['New York, NY', 'San Francisco, CA', 'Remote'])
            job_sites: List of job sites to scrape from (['indeed', 'linkedin', 'zip_recruiter', 'glassdoor'])
            results_wanted: Number of results to fetch
            country: Country to search in
        """
        if search_terms is None:
            search_terms = ['software engineer', 'data scientist', 'product manager', 'designer']
        
        if locations is None:
            locations = ['New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL', 'Remote']
        
        if job_sites is None:
            job_sites = ['indeed', 'linkedin']
        
        all_jobs = []
        
        for search_term in search_terms:
            for location in locations:
                try:
                    print(f"[JOBSPY] Scraping: '{search_term}' in '{location}'")
                    
                    # Scrape jobs using JobSpy
                    jobs_df = scrape_jobs(
                        site_name=job_sites,
                        search_term=search_term,
                        location=location,
                        results_wanted=min(results_wanted, 20),  # Limit per search to avoid rate limits
                        hours_old=72,  # Only get jobs posted in last 72 hours
                        country_indeed=country.lower(),
                        hyperlinks=True,
                        verbose=0
                    )
                    
                    if jobs_df is not None and not jobs_df.empty:
                        print(f"[JOBSPY] Found {len(jobs_df)} jobs for '{search_term}' in '{location}'")
                        
                        for _, job in jobs_df.iterrows():
                            try:
                                # Convert job data to our format
                                skills = self.extract_skills(str(job.get('title', '')), str(job.get('description', '')))
                                category, subcategory = self.categorize_job(str(job.get('title', '')), skills)
                                experience_level = self.determine_experience_level(
                                    str(job.get('title', '')), 
                                    str(job.get('description', ''))
                                )
                                
                                job_data = {
                                    'title': str(job.get('title', 'Unknown Position')),
                                    'company': str(job.get('company', 'Unknown Company')),
                                    'description': str(job.get('description', ''))[:2000],  # Limit description length
                                    'location': str(job.get('location', location)),
                                    'work_mode': 'remote' if 'remote' in str(job.get('location', '')).lower() else 'onsite',
                                    'job_type': 'full-time',  # Default, JobSpy doesn't always provide this
                                    'experience_level': experience_level,
                                    'salary_range': self.clean_salary(
                                        job.get('min_amount'), 
                                        job.get('max_amount')
                                    ),
                                    'skills': skills,
                                    'source_url': str(job.get('job_url', '')),
                                    'source_platform': str(job.get('site', 'unknown')),
                                    'external_id': f"{job.get('site', 'unknown')}_{hash(str(job.get('job_url', '')))}",
                                    'category': category,
                                    'subcategory': subcategory,
                                    'tags': skills[:5],  # Use first 5 skills as tags
                                    'scraped_at': datetime.now()
                                }
                                all_jobs.append(job_data)
                            except Exception as job_error:
                                print(f"[JOBSPY] Error processing individual job: {str(job_error)}")
                                continue
                    
                except Exception as e:
                    print(f"[JOBSPY] Error scraping '{search_term}' in '{location}': {str(e)}")
                    continue
        
        print(f"[JOBSPY] Total jobs scraped: {len(all_jobs)}")
        return all_jobs
    
    def save_jobs_to_db(self, jobs: List[Dict[str, Any]]) -> int:
        """Save scraped jobs to database"""
        if not jobs:
            return 0
        
        saved_count = 0
        conn = self.get_db_connection()
        
        try:
            cursor = conn.cursor()
            
            for job in jobs:
                try:
                    # Check if job already exists (based on external_id)
                    cursor.execute(
                        "SELECT id FROM scraped_jobs WHERE external_id = %s",
                        (job['external_id'],)
                    )
                    
                    if cursor.fetchone():
                        print(f"[JOBSPY] Job already exists: {job['title']} at {job['company']}")
                        continue
                    
                    # Insert new job
                    insert_query = """
                    INSERT INTO scraped_jobs (
                        title, company, description, location, work_mode, job_type,
                        experience_level, salary_range, skills, source_url, source_platform,
                        external_id, category, subcategory, tags, last_scraped, expires_at,
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    """
                    
                    # Set expiration date (30 days from now)
                    expires_at = datetime.now() + timedelta(days=30)
                    
                    cursor.execute(insert_query, (
                        job['title'],
                        job['company'],
                        job['description'],
                        job['location'],
                        job['work_mode'],
                        job['job_type'],
                        job['experience_level'],
                        job['salary_range'],
                        job['skills'],
                        job['source_url'],
                        job['source_platform'],
                        job['external_id'],
                        job['category'],
                        job['subcategory'],
                        job['tags'],
                        job['scraped_at'],
                        expires_at,
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    saved_count += 1
                    print(f"[JOBSPY] Saved: {job['title']} at {job['company']}")
                    
                except psycopg2.Error as e:
                    print(f"[JOBSPY] Database error for {job['title']}: {str(e)}")
                    continue
            
            conn.commit()
            
        except Exception as e:
            print(f"[JOBSPY] Database connection error: {str(e)}")
            conn.rollback()
        finally:
            conn.close()
        
        return saved_count
    
    def run_scraping(self, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run the complete scraping process"""
        if config is None:
            config = {}
        
        try:
            # Get configuration with defaults
            search_terms = config.get('search_terms', [
                'software engineer', 'frontend developer', 'backend developer', 
                'full stack developer', 'data scientist', 'product manager', 
                'ux designer', 'devops engineer'
            ])
            
            locations = config.get('locations', [
                'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 
                'Chicago, IL', 'Austin, TX', 'Seattle, WA', 'Remote'
            ])
            
            job_sites = config.get('job_sites', ['indeed', 'linkedin'])
            results_wanted = config.get('results_wanted', 50)
            country = config.get('country', 'USA')
            
            print(f"[JOBSPY] Starting scraping with {len(search_terms)} search terms and {len(locations)} locations")
            
            # Scrape jobs
            scraped_jobs = self.scrape_jobs_jobspy(
                search_terms=search_terms,
                locations=locations,
                job_sites=job_sites,
                results_wanted=results_wanted,
                country=country
            )
            
            # Save to database
            saved_count = self.save_jobs_to_db(scraped_jobs)
            
            result = {
                'success': True,
                'scraped_count': len(scraped_jobs),
                'saved_count': saved_count,
                'search_terms': search_terms,
                'locations': locations,
                'job_sites': job_sites,
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"[JOBSPY] Scraping completed: {saved_count}/{len(scraped_jobs)} jobs saved")
            return result
            
        except Exception as e:
            error_msg = f"Error during scraping: {str(e)}\n{traceback.format_exc()}"
            print(f"[JOBSPY] {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'timestamp': datetime.now().isoformat()
            }

def main():
    """CLI interface for JobSpy scraping"""
    try:
        # Get configuration from command line arguments or use defaults
        config = {}
        
        if len(sys.argv) > 1:
            # Try to parse JSON config from command line
            try:
                config = json.loads(sys.argv[1])
            except json.JSONDecodeError:
                print("Invalid JSON config provided, using defaults")
        
        # Run scraping
        scraper = JobSpyIntegration()
        result = scraper.run_scraping(config)
        
        # Print result as JSON
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()