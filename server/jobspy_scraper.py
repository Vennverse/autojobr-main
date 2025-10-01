
#!/usr/bin/env python3
"""
JobSpy Integration Script for AutoJobr
Enhanced for international job scraping from India, USA, and Europe
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
import time
import random

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
        
        # Enhanced search terms for better coverage
        self.ENHANCED_SEARCH_TERMS = {
            # Technology roles - most in-demand
            'tech': [
                'software engineer', 'software developer', 'full stack developer', 'frontend developer', 'backend developer',
                'python developer', 'javascript developer', 'react developer', 'node.js developer', 'java developer',
                'data scientist', 'data engineer', 'data analyst', 'machine learning engineer', 'ai engineer',
                'devops engineer', 'cloud engineer', 'system administrator', 'network engineer',
                'mobile developer', 'ios developer', 'android developer', 'react native developer',
                'ui/ux designer', 'product designer', 'web designer', 'graphic designer',
                'cybersecurity engineer', 'security analyst', 'penetration tester',
                'database administrator', 'software architect', 'technical lead', 'engineering manager'
            ],
            # Business roles
            'business': [
                'product manager', 'project manager', 'business analyst', 'operations manager',
                'account manager', 'sales representative', 'business development manager', 'sales director',
                'marketing manager', 'digital marketing manager', 'content manager', 'social media manager',
                'hr manager', 'recruiter', 'talent acquisition specialist', 'hr business partner',
                'financial analyst', 'accountant', 'finance manager', 'investment analyst',
                'consultant', 'strategy manager', 'operations analyst', 'process manager'
            ],
            # Entry level roles
            'entry_level': [
                'junior software engineer', 'entry level developer', 'graduate trainee', 'software intern',
                'junior data scientist', 'associate consultant', 'trainee engineer', 'fresher developer',
                'junior analyst', 'associate software engineer', 'graduate engineer', 'campus hire'
            ]
        }
        
        # Enhanced locations for India, USA, and Europe
        self.ENHANCED_LOCATIONS = {
            # India - Major tech hubs and cities
            'india': [
                'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India', 'Chennai, India',
                'Pune, India', 'Kolkata, India', 'Ahmedabad, India', 'Gurgaon, India', 'Noida, India',
                'Jaipur, India', 'Kochi, India', 'Indore, India', 'Nagpur, India', 'Lucknow, India',
                'Coimbatore, India', 'Vadodara, India', 'Chandigarh, India', 'Mysore, India', 'Thiruvananthapuram, India',
                'India', 'Remote India', 'Work from Home India'
            ],
            # USA - Major job markets
            'usa': [
                'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Austin, TX', 'Seattle, WA',
                'Chicago, IL', 'Boston, MA', 'Denver, CO', 'Atlanta, GA', 'Miami, FL',
                'Phoenix, AZ', 'Philadelphia, PA', 'Dallas, TX', 'Houston, TX', 'San Jose, CA',
                'Washington, DC', 'Portland, OR', 'Nashville, TN', 'Charlotte, NC', 'Minneapolis, MN',
                'United States', 'Remote USA', 'Remote United States'
            ],
            # Europe - Major tech hubs
            'europe': [
                'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Dublin, Ireland',
                'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
                'Paris, France', 'Lyon, France', 'Nice, France', 'Amsterdam, Netherlands',
                'Madrid, Spain', 'Barcelona, Spain', 'Milan, Italy', 'Rome, Italy',
                'Stockholm, Sweden', 'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland',
                'Zurich, Switzerland', 'Vienna, Austria', 'Brussels, Belgium', 'Prague, Czech Republic',
                'Remote Europe', 'European Union'
            ]
        }
        
        # Country-specific job sites optimization
        self.COUNTRY_JOB_SITES = {
            'india': ['indeed', 'linkedin', 'naukri'],
            'usa': ['indeed', 'linkedin', 'zip_recruiter'],
            'europe': ['indeed', 'linkedin'],
            'global': ['indeed', 'linkedin']
        }
    
    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_url)
    
    def smart_delay(self, min_delay=2, max_delay=5):
        """Implement smart delay to avoid rate limiting"""
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def categorize_job(self, title: str, skills: List[str], description: str = '') -> tuple:
        """Enhanced job categorization"""
        title_lower = title.lower()
        description_lower = description.lower() if description else ''
        skills_str = ' '.join(skills).lower() if skills else ''
        text = f"{title_lower} {description_lower} {skills_str}"
        
        # Technology roles
        if any(keyword in text for keyword in ['engineer', 'developer', 'programmer', 'software']):
            if 'frontend' in text or 'front-end' in text or any(skill in skills_str for skill in ['react', 'vue', 'angular']):
                return 'tech', 'frontend'
            elif 'backend' in text or 'back-end' in text:
                return 'tech', 'backend'
            elif 'full stack' in text or 'fullstack' in text:
                return 'tech', 'fullstack'
            elif 'devops' in text or 'site reliability' in text:
                return 'tech', 'devops'
            elif 'mobile' in text or any(skill in skills_str for skill in ['ios', 'android', 'react native', 'flutter']):
                return 'tech', 'mobile'
            else:
                return 'tech', 'software-engineering'
        
        elif any(keyword in text for keyword in ['data scientist', 'data engineer', 'data analyst', 'machine learning', 'ai engineer']):
            if 'scientist' in text:
                return 'tech', 'data-science'
            elif 'engineer' in text:
                return 'tech', 'data-engineering'
            else:
                return 'tech', 'data-analytics'
        
        elif any(keyword in text for keyword in ['designer', 'ux', 'ui', 'design']):
            if 'ux' in text or 'user experience' in text:
                return 'design', 'ux'
            elif 'ui' in text or 'user interface' in text:
                return 'design', 'ui'
            elif 'product design' in text:
                return 'design', 'product-design'
            else:
                return 'design', 'visual-design'
        
        elif any(keyword in text for keyword in ['product manager', 'pm', 'product owner']):
            return 'product', 'product-management'
        
        elif any(keyword in text for keyword in ['marketing', 'growth', 'content', 'social media']):
            return 'marketing', 'digital-marketing'
        
        elif any(keyword in text for keyword in ['sales', 'account manager', 'business development']):
            return 'sales', 'business-development'
        
        else:
            return 'general', 'other'
    
    def determine_experience_level(self, title: str, description: str = '') -> str:
        """Determine experience level from title and description"""
        text = f"{title} {description}".lower()
        
        if any(keyword in text for keyword in ['senior', 'sr.', 'lead', 'principal', 'staff', 'architect']):
            return 'senior'
        elif any(keyword in text for keyword in ['junior', 'jr.', 'entry', 'entry-level', 'graduate', 'intern', 'fresher', 'trainee']):
            return 'entry'
        elif any(keyword in text for keyword in ['mid', 'mid-level', 'intermediate']):
            return 'mid'
        else:
            return 'mid'
    
    def clean_salary(self, salary_min: Optional[float], salary_max: Optional[float], country_code: str = 'US', salary_text: str = '') -> tuple[Optional[str], Optional[int], Optional[int], str]:
        """Enhanced salary cleaning with international currency support"""
        try:
            currency_map = {
                'US': 'USD', 'IN': 'INR', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 
                'ES': 'EUR', 'IT': 'EUR', 'NL': 'EUR', 'AU': 'AUD', 'AE': 'AED', 
                'CA': 'CAD', 'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK'
            }
            currency = currency_map.get(country_code, 'USD')
            currency_symbol = '$' if currency == 'USD' else '₹' if currency == 'INR' else '£' if currency == 'GBP' else '€' if currency in ['EUR'] else '$'
            
            clean_min = None
            clean_max = None
            
            if salary_min is not None and not pd.isna(salary_min) and salary_min > 0:
                clean_min = int(float(salary_min))
                
            if salary_max is not None and not pd.isna(salary_max) and salary_max > 0:
                clean_max = int(float(salary_max))
            
            salary_range = None
            if clean_min and clean_max:
                salary_range = f"{currency_symbol}{clean_min:,} - {currency_symbol}{clean_max:,}"
            elif clean_min:
                salary_range = f"{currency_symbol}{clean_min:,}+"
            elif clean_max:
                salary_range = f"Up to {currency_symbol}{clean_max:,}"
            
            return salary_range, clean_min, clean_max, currency
            
        except (ValueError, TypeError, OverflowError):
            return None, None, None, currency_map.get(country_code, 'USD')
    
    def extract_skills(self, title: str, description: str, category: str = '') -> List[str]:
        """Enhanced skill extraction with international focus"""
        tech_skills = [
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux', 'SQL', 'NoSQL',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ',
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'AI',
            'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
            'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence'
        ]
        
        business_skills = [
            'Salesforce', 'HubSpot', 'CRM', 'Google Analytics', 'SEO', 'SEM', 'Excel',
            'PowerBI', 'Tableau', 'SAP', 'QuickBooks', 'Financial Modeling'
        ]
        
        all_skills = tech_skills + business_skills
        text = f"{title} {description}".lower()
        found_skills = []
        
        for skill in all_skills:
            if skill.lower() in text:
                found_skills.append(skill)
        
        return found_skills[:15]
    
    def parse_location(self, location_str: str, country_code: str = '') -> tuple[str, str, str, str]:
        """Enhanced location parsing for international locations"""
        try:
            location_str = location_str.strip()
            parts = [part.strip() for part in location_str.split(',')]
            
            city = ''
            region = ''
            detected_country_code = country_code or 'US'
            
            if 'remote' in location_str.lower():
                return detected_country_code, 'Remote', 'Remote', 'Remote'
            
            # Enhanced country detection
            country_patterns = {
                'US': ['USA', 'United States', 'US', 'NY', 'CA', 'TX', 'FL', 'IL', 'WA', 'MA'],
                'IN': ['India', 'IN', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'],
                'GB': ['UK', 'United Kingdom', 'England', 'London', 'Manchester', 'Birmingham'],
                'DE': ['Germany', 'DE', 'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
                'FR': ['France', 'FR', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
                'ES': ['Spain', 'ES', 'Madrid', 'Barcelona', 'Valencia', 'Seville'],
                'IT': ['Italy', 'IT', 'Milan', 'Rome', 'Naples', 'Turin'],
                'NL': ['Netherlands', 'NL', 'Amsterdam', 'Rotterdam', 'The Hague'],
                'AU': ['Australia', 'AU', 'Sydney', 'Melbourne', 'Brisbane', 'Perth'],
                'CA': ['Canada', 'CA', 'Toronto', 'Vancouver', 'Montreal', 'Calgary']
            }
            
            for code, keywords in country_patterns.items():
                if any(keyword in location_str for keyword in keywords):
                    detected_country_code = code
                    break
            
            if len(parts) == 1:
                city = parts[0]
            elif len(parts) >= 2:
                city = parts[0]
                region = parts[1] if len(parts) > 1 else ''
                
            city = city.replace(' Area', '').replace(' Metropolitan', '').strip()
            region = region.replace(' Area', '').replace(' Metropolitan', '').strip()
            
            if region and city != region:
                normalized_location = f"{city}, {region}"
            else:
                normalized_location = city
            
            return detected_country_code, region, city, normalized_location
            
        except Exception as e:
            print(f"[JOBSPY] Error parsing location '{location_str}': {str(e)}")
            return country_code or 'US', '', location_str, location_str
    
    def scrape_jobs_enhanced(
        self, 
        search_terms: List[str] = None, 
        locations: List[str] = None,
        job_sites: List[str] = None,
        results_wanted: int = 100,
        country: str = 'USA'
    ) -> List[Dict[str, Any]]:
        """Enhanced job scraping with better international coverage"""
        
        # Use comprehensive search terms if none provided
        if search_terms is None:
            search_terms = (
                self.ENHANCED_SEARCH_TERMS['tech'][:10] + 
                self.ENHANCED_SEARCH_TERMS['business'][:5] + 
                self.ENHANCED_SEARCH_TERMS['entry_level'][:5]
            )
        
        # Use comprehensive locations if none provided
        if locations is None:
            locations = (
                self.ENHANCED_LOCATIONS['india'][:8] + 
                self.ENHANCED_LOCATIONS['usa'][:8] + 
                self.ENHANCED_LOCATIONS['europe'][:8]
            )
        
        # Optimize job sites based on region
        if job_sites is None:
            if 'india' in country.lower():
                job_sites = self.COUNTRY_JOB_SITES['india']
            elif 'usa' in country.lower() or 'united states' in country.lower():
                job_sites = self.COUNTRY_JOB_SITES['usa']
            elif any(eu_country in country.lower() for eu_country in ['uk', 'germany', 'france', 'spain', 'italy', 'netherlands']):
                job_sites = self.COUNTRY_JOB_SITES['europe']
            else:
                job_sites = self.COUNTRY_JOB_SITES['global']
        
        all_jobs = []
        successful_searches = 0
        failed_searches = 0
        
        # Reduce results per search to avoid rate limiting
        results_per_search = min(15, results_wanted // len(search_terms))
        
        print(f"[JOBSPY] Enhanced scraping: {len(search_terms)} terms, {len(locations)} locations, {results_per_search} results each")
        
        for i, search_term in enumerate(search_terms):
            # Rotate through locations to distribute load
            location_batch = locations[i % len(locations):i % len(locations) + 3]  # Use 3 locations per search term
            
            for location in location_batch:
                try:
                    print(f"[JOBSPY] Scraping: '{search_term}' in '{location}' ({successful_searches + failed_searches + 1}/{len(search_terms) * 3})")
                    
                    # Smart delay to avoid rate limiting
                    self.smart_delay(2, 4)
                    
                    # Map country for JobSpy
                    country_mapping = {
                        'USA': 'us', 'INDIA': 'india', 'UK': 'uk', 'GERMANY': 'germany',
                        'FRANCE': 'france', 'SPAIN': 'spain', 'ITALY': 'italy', 'NETHERLANDS': 'netherlands'
                    }
                    valid_country = country_mapping.get(country.upper(), 'us')
                    
                    # Enhanced scraping parameters
                    jobs_df = scrape_jobs(
                        site_name=job_sites,
                        search_term=search_term,
                        location=location,
                        results_wanted=results_per_search,
                        hours_old=72,
                        country_indeed=valid_country,
                        hyperlinks=True,
                        verbose=0,
                        description_format="html",
                        linkedin_fetch_description=False,
                        enforce_annual_salary=False,
                        easy_apply=False,
                        is_remote=('remote' in location.lower())
                    )
                    
                    if jobs_df is not None and not jobs_df.empty:
                        print(f"[JOBSPY] Found {len(jobs_df)} jobs for '{search_term}' in '{location}'")
                        
                        for _, job in jobs_df.iterrows():
                            try:
                                title = str(job.get('title', ''))
                                description = str(job.get('description', ''))
                                job_location = str(job.get('location', location))
                                
                                # Enhanced data processing
                                country_code, region, city, normalized_location = self.parse_location(job_location)
                                basic_skills = self.extract_skills(title, description, '')
                                category, subcategory = self.categorize_job(title, basic_skills, description)
                                skills = self.extract_skills(title, description, category)
                                experience_level = self.determine_experience_level(title, description)
                                
                                salary_range, salary_min, salary_max, currency = self.clean_salary(
                                    job.get('min_amount'), 
                                    job.get('max_amount'),
                                    country_code
                                )
                                
                                work_mode = 'remote' if 'remote' in job_location.lower() else 'onsite'
                                
                                job_data = {
                                    'title': title[:255],
                                    'company': str(job.get('company', 'Unknown Company'))[:255],
                                    'description': description[:3000],
                                    'location': normalized_location[:255],
                                    'work_mode': work_mode,
                                    'job_type': 'full-time',
                                    'experience_level': experience_level,
                                    'salary_range': salary_range,
                                    'skills': skills,
                                    'country_code': country_code,
                                    'region': region[:100],
                                    'city': city[:100],
                                    'salary_min': salary_min,
                                    'salary_max': salary_max,
                                    'currency': currency,
                                    'salary_period': 'yearly',
                                    'source_url': str(job.get('job_url', ''))[:500],
                                    'source_platform': str(job.get('site', 'unknown'))[:50],
                                    'external_id': f"{job.get('site', 'unknown')}_{hash(str(job.get('job_url', '')))}",
                                    'language': 'en',
                                    'category': category,
                                    'subcategory': subcategory,
                                    'tags': skills[:5],
                                    'scraped_at': datetime.now()
                                }
                                all_jobs.append(job_data)
                                
                            except Exception as job_error:
                                print(f"[JOBSPY] Error processing job: {str(job_error)}")
                                continue
                        
                        successful_searches += 1
                    else:
                        print(f"[JOBSPY] No jobs found for '{search_term}' in '{location}'")
                        failed_searches += 1
                    
                except Exception as e:
                    print(f"[JOBSPY] Error scraping '{search_term}' in '{location}': {str(e)}")
                    failed_searches += 1
                    continue
        
        print(f"[JOBSPY] Enhanced scraping completed: {len(all_jobs)} jobs found")
        print(f"[JOBSPY] Success rate: {successful_searches}/{successful_searches + failed_searches} searches")
        return all_jobs
    
    def save_jobs_to_db(self, jobs: List[Dict[str, Any]]) -> int:
        """Save scraped jobs to database with enhanced error handling"""
        if not jobs:
            return 0
        
        saved_count = 0
        conn = self.get_db_connection()
        
        try:
            cursor = conn.cursor()
            
            for job in jobs:
                try:
                    # Check if job already exists
                    cursor.execute(
                        "SELECT id FROM scraped_jobs WHERE external_id = %s",
                        (job['external_id'],)
                    )
                    
                    if cursor.fetchone():
                        continue
                    
                    # Enhanced insertion with all fields
                    insert_query = """
                    INSERT INTO scraped_jobs (
                        title, company, description, location, work_mode, job_type,
                        experience_level, salary_range, skills, 
                        country_code, region, city, 
                        salary_min, salary_max, currency, salary_period,
                        source_url, source_platform, external_id, language,
                        category, subcategory, tags, last_scraped, expires_at,
                        created_at, updated_at, is_active
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, 
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s, %s
                    )
                    """
                    
                    expires_at = datetime.now() + timedelta(days=30)
                    
                    cursor.execute(insert_query, (
                        job['title'], job['company'], job['description'], job['location'],
                        job['work_mode'], job['job_type'], job['experience_level'], job['salary_range'],
                        job['skills'], job['country_code'], job['region'], job['city'],
                        job['salary_min'], job['salary_max'], job['currency'], job['salary_period'],
                        job['source_url'], job['source_platform'], job['external_id'], job['language'],
                        job['category'], job['subcategory'], job['tags'], job['scraped_at'],
                        expires_at, datetime.now(), datetime.now(), True
                    ))
                    
                    saved_count += 1
                    
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
        """Enhanced scraping process with international focus"""
        if config is None:
            config = {}
        
        try:
            # Enhanced default configuration for international markets
            search_terms = config.get('search_terms', 
                self.ENHANCED_SEARCH_TERMS['tech'][:8] + 
                self.ENHANCED_SEARCH_TERMS['business'][:4] + 
                self.ENHANCED_SEARCH_TERMS['entry_level'][:3]
            )
            
            locations = config.get('locations',
                self.ENHANCED_LOCATIONS['india'][:6] + 
                self.ENHANCED_LOCATIONS['usa'][:6] + 
                self.ENHANCED_LOCATIONS['europe'][:6]
            )
            
            job_sites = config.get('job_sites', ['indeed', 'linkedin'])
            results_wanted = config.get('results_wanted', 150)  # Increased for better coverage
            country = config.get('country', 'USA')
            
            print(f"[JOBSPY] Enhanced international scraping: {len(search_terms)} terms, {len(locations)} locations")
            
            # Enhanced scraping
            scraped_jobs = self.scrape_jobs_enhanced(
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
                'coverage': {
                    'india_jobs': len([j for j in scraped_jobs if j.get('country_code') == 'IN']),
                    'usa_jobs': len([j for j in scraped_jobs if j.get('country_code') == 'US']),
                    'europe_jobs': len([j for j in scraped_jobs if j.get('country_code') in ['GB', 'DE', 'FR', 'ES', 'IT', 'NL']])
                },
                'timestamp': datetime.now().isoformat()
            }
            
            print(f"[JOBSPY] Enhanced scraping completed: {saved_count}/{len(scraped_jobs)} jobs saved")
            print(f"[JOBSPY] Geographic coverage: India: {result['coverage']['india_jobs']}, USA: {result['coverage']['usa_jobs']}, Europe: {result['coverage']['europe_jobs']}")
            return result
            
        except Exception as e:
            error_msg = f"Error during enhanced scraping: {str(e)}\n{traceback.format_exc()}"
            print(f"[JOBSPY] {error_msg}")
            return {
                'success': False,
                'error': error_msg,
                'timestamp': datetime.now().isoformat()
            }

def main():
    """Enhanced CLI interface for international JobSpy scraping"""
    try:
        config = {}
        
        if len(sys.argv) > 1:
            try:
                config = json.loads(sys.argv[1])
            except json.JSONDecodeError:
                print("Invalid JSON config provided, using enhanced defaults")
        
        # Run enhanced scraping
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
