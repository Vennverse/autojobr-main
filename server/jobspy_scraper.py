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
    
    def categorize_job(self, title: str, skills: List[str], description: str = '') -> tuple:
        """Categorize job based on title, skills, and description"""
        title_lower = title.lower()
        description_lower = description.lower() if description else ''
        skills_str = ' '.join(skills).lower() if skills else ''
        text = f"{title_lower} {description_lower} {skills_str}"
        
        # Categories and subcategories mapping - now uses combined text
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
        elif any(keyword in text for keyword in ['junior', 'jr.', 'entry', 'entry-level', 'graduate', 'intern']):
            return 'entry'
        elif any(keyword in text for keyword in ['mid', 'mid-level', 'intermediate']):
            return 'mid'
        else:
            # Default to mid-level if not specified
            return 'mid'
    
    def clean_salary(self, salary_min: Optional[float], salary_max: Optional[float], country_code: str = 'US', salary_text: str = '') -> tuple[Optional[str], Optional[int], Optional[int], str]:
        """Clean and format salary range with international currency support"""
        try:
            # Determine currency based on country
            currency_map = {
                'US': 'USD', 'IN': 'INR', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 
                'ES': 'EUR', 'AU': 'AUD', 'AE': 'AED', 'CA': 'CAD'
            }
            currency = currency_map.get(country_code, 'USD')
            currency_symbol = '$' if currency == 'USD' else '₹' if currency == 'INR' else '£' if currency == 'GBP' else '€' if currency in ['EUR'] else '$'
            
            # Clean salary values
            clean_min = None
            clean_max = None
            
            if salary_min is not None and not pd.isna(salary_min) and salary_min > 0:
                clean_min = int(float(salary_min))
                
            if salary_max is not None and not pd.isna(salary_max) and salary_max > 0:
                clean_max = int(float(salary_max))
            
            # Generate formatted salary range
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
        """Extract skills from job title and description, with category-specific focus"""
        # Base common skills
        common_skills = [
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux', 'SQL', 'NoSQL',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ',
            'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'AI',
            'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InVision', 'Framer',
            'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Slack', 'Notion'
        ]
        
        # Category-specific skills
        if category == 'sales':
            common_skills.extend(['Salesforce', 'HubSpot', 'CRM', 'Lead Generation', 'Cold Calling', 'Pipeline Management'])
        elif category == 'marketing':
            common_skills.extend(['Google Analytics', 'SEO', 'SEM', 'Social Media', 'Content Marketing', 'Email Marketing', 'HubSpot', 'Mailchimp'])
        elif category == 'design':
            common_skills.extend(['UI/UX', 'Prototyping', 'Wireframing', 'User Research', 'Design Systems'])
        elif category == 'finance':
            common_skills.extend(['Excel', 'Financial Modeling', 'Budgeting', 'Forecasting', 'SAP', 'QuickBooks'])
        
        text = f"{title} {description}".lower()
        found_skills = []
        
        for skill in common_skills:
            if skill.lower() in text:
                found_skills.append(skill)
        
        return found_skills[:10]  # Limit to top 10 skills
    
    def parse_location(self, location_str: str, country_code: str = '') -> tuple[str, str, str, str]:
        """Parse location string to extract country_code, region, city, and normalized location"""
        try:
            location_str = location_str.strip()
            parts = [part.strip() for part in location_str.split(',')]
            
            # Default values
            city = ''
            region = ''
            detected_country_code = country_code or 'US'
            
            if 'remote' in location_str.lower():
                return detected_country_code, 'Remote', 'Remote', 'Remote'
            
            # Country detection patterns
            country_patterns = {
                'US': ['USA', 'United States', 'US', 'NY', 'CA', 'TX', 'FL', 'IL', 'WA', 'MA', 'AZ', 'GA', 'CO', 'NC', 'OH'],
                'IN': ['India', 'IN', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida'],
                'GB': ['UK', 'United Kingdom', 'England', 'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol'],
                'DE': ['Germany', 'DE', 'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart'],
                'AU': ['Australia', 'AU', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
                'AE': ['UAE', 'United Arab Emirates', 'Dubai', 'Abu Dhabi', 'Sharjah'],
                'CA': ['Canada', 'CA', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
                'FR': ['France', 'FR', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
                'ES': ['Spain', 'ES', 'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao']
            }
            
            # Detect country
            for code, keywords in country_patterns.items():
                if any(keyword in location_str for keyword in keywords):
                    detected_country_code = code
                    break
            
            # Extract city and region based on parts
            if len(parts) == 1:
                city = parts[0]
            elif len(parts) == 2:
                city = parts[0]
                region = parts[1]
            elif len(parts) >= 3:
                city = parts[0]
                region = parts[1]
                # Last part might be country
                
            # Clean up city and region
            city = city.replace(' Area', '').replace(' Metropolitan', '').strip()
            region = region.replace(' Area', '').replace(' Metropolitan', '').strip()
            
            # Generate normalized location
            if region and city != region:
                normalized_location = f"{city}, {region}"
            else:
                normalized_location = city
            
            return detected_country_code, region, city, normalized_location
            
        except Exception as e:
            print(f"[JOBSPY] Error parsing location '{location_str}': {str(e)}")
            return country_code or 'US', '', location_str, location_str
    
    def detect_work_mode(self, title: str, description: str, location: str = '') -> str:
        """Detect work mode (remote/hybrid/onsite) from job content"""
        try:
            text = f"{title} {description} {location}".lower()
            
            # Remote indicators
            remote_keywords = [
                'remote', 'work from home', 'wfh', 'distributed', 'virtual',
                'anywhere', 'location independent', 'telecommute', 'home based'
            ]
            
            # Hybrid indicators
            hybrid_keywords = [
                'hybrid', 'flexible', 'part remote', 'partially remote',
                'mix of remote', 'some remote', 'flexible location'
            ]
            
            # Onsite indicators
            onsite_keywords = [
                'on-site', 'onsite', 'office based', 'in office', 'relocate',
                'commute', 'on premise', 'on premises', 'headquarters'
            ]
            
            if any(keyword in text for keyword in remote_keywords):
                return 'remote'
            elif any(keyword in text for keyword in hybrid_keywords):
                return 'hybrid'
            elif any(keyword in text for keyword in onsite_keywords):
                return 'onsite'
            else:
                # Default based on location
                if 'remote' in location.lower():
                    return 'remote'
                else:
                    return 'onsite'  # Default assumption
                    
        except Exception as e:
            print(f"[JOBSPY] Error detecting work mode: {str(e)}")
            return 'onsite'
    
    def detect_language(self, title: str, description: str, country_code: str = '') -> str:
        """Detect job posting language based on content and country"""
        try:
            # Country-based language detection
            country_languages = {
                'US': 'en', 'GB': 'en', 'AU': 'en', 'CA': 'en', 'IN': 'en',
                'DE': 'de', 'FR': 'fr', 'ES': 'es', 'IT': 'it', 'BR': 'pt',
                'NL': 'nl', 'SE': 'sv', 'NO': 'no', 'DK': 'da', 'FI': 'fi'
            }
            
            # Default to country-based language
            default_lang = country_languages.get(country_code, 'en')
            
            # Simple keyword-based detection
            text = f"{title} {description}".lower()
            
            # German indicators
            german_words = ['und', 'der', 'die', 'das', 'mit', 'für', 'von', 'zu', 'im', 'am', 'arbeit', 'stelle']
            if any(word in text for word in german_words) and len([word for word in german_words if word in text]) >= 2:
                return 'de'
            
            # French indicators
            french_words = ['et', 'le', 'la', 'les', 'de', 'du', 'des', 'pour', 'avec', 'dans', 'travail', 'emploi']
            if any(word in text for word in french_words) and len([word for word in french_words if word in text]) >= 2:
                return 'fr'
            
            # Spanish indicators
            spanish_words = ['y', 'el', 'la', 'los', 'las', 'de', 'del', 'para', 'con', 'en', 'trabajo', 'empleo']
            if any(word in text for word in spanish_words) and len([word for word in spanish_words if word in text]) >= 2:
                return 'es'
            
            return default_lang
            
        except Exception as e:
            print(f"[JOBSPY] Error detecting language: {str(e)}")
            return 'en'
    
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
            locations = ['New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL', 'Remote', 'Mumbai, India', 'Bangalore, India', 'Delhi, India']
        
        if job_sites is None:
            job_sites = ['indeed', 'linkedin', 'zip_recruiter', 'glassdoor', 'naukri']  # Added Naukri for India market coverage
        
        all_jobs = []
        
        for search_term in search_terms:
            for location in locations:
                try:
                    print(f"[JOBSPY] Scraping: '{search_term}' in '{location}'")
                    
                    # Scrape jobs using JobSpy with improved parameters
                    jobs_df = scrape_jobs(
                        site_name=job_sites,
                        search_term=search_term,
                        location=location,
                        results_wanted=min(results_wanted, 20),  # Limit per search to avoid rate limits
                        hours_old=72,  # Only get jobs posted in last 72 hours
                        country_indeed=country.lower(),
                        hyperlinks=True,
                        verbose=1,  # Show warnings and errors for better debugging
                        description_format="markdown",  # Better formatted descriptions  
                        linkedin_fetch_description=True,  # Get full LinkedIn descriptions
                        enforce_annual_salary=True,  # Standardize salary format
                        easy_apply=False,  # Don't filter for easy apply to get more results
                        is_remote=(location.lower() == 'remote')  # Set remote flag for remote searches
                    )
                    
                    if jobs_df is not None and not jobs_df.empty:
                        print(f"[JOBSPY] Found {len(jobs_df)} jobs for '{search_term}' in '{location}'")
                        
                        for _, job in jobs_df.iterrows():
                            try:
                                # Convert job data to our format - enhanced for global support
                                title = str(job.get('title', ''))
                                description = str(job.get('description', ''))
                                job_location = str(job.get('location', location))
                                
                                # Parse location information
                                country_code, region, city, normalized_location = self.parse_location(job_location)
                                
                                # First extract basic skills for categorization
                                basic_skills = self.extract_skills(title, description, '')
                                
                                # Enhanced categorization with description and basic skills
                                category, subcategory = self.categorize_job(title, basic_skills, description)
                                
                                # Enhanced skill extraction based on determined category
                                skills = self.extract_skills(title, description, category)
                                # Determine experience level
                                experience_level = self.determine_experience_level(title, description)
                                
                                # Enhanced salary processing with international currency support
                                salary_text = f"{job.get('min_amount', '')} {job.get('max_amount', '')} {job.get('currency', '')}"
                                salary_range, salary_min, salary_max, currency = self.clean_salary(
                                    job.get('min_amount'), 
                                    job.get('max_amount'),
                                    country_code,
                                    salary_text
                                )
                                
                                # Detect work mode and language
                                work_mode = self.detect_work_mode(title, description, job_location)
                                language = self.detect_language(title, description, country_code)
                                
                                job_data = {
                                    # Basic job information
                                    'title': title,
                                    'company': str(job.get('company', 'Unknown Company')),
                                    'description': description[:2000],  # Limit description length
                                    'location': normalized_location,
                                    'work_mode': work_mode,
                                    'job_type': 'full-time',  # Default, JobSpy doesn't always provide this
                                    'experience_level': experience_level,
                                    'salary_range': salary_range,
                                    'skills': skills,
                                    # Location details for international support
                                    'country_code': country_code,
                                    'region': region,
                                    'city': city,
                                    # Salary details with currency support
                                    'salary_min': salary_min,
                                    'salary_max': salary_max,
                                    'currency': currency,
                                    'salary_period': 'yearly',  # Default assumption
                                    # Source information
                                    'source_url': str(job.get('job_url', '')),
                                    'source_platform': str(job.get('site', 'unknown')),
                                    'external_id': f"{job.get('site', 'unknown')}_{hash(str(job.get('job_url', '')))}",
                                    'language': language,
                                    # Categorization for global job markets
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
                    
                    # Insert new job with all international fields
                    insert_query = """
                    INSERT INTO scraped_jobs (
                        title, company, description, location, work_mode, job_type,
                        experience_level, salary_range, skills, 
                        country_code, region, city, 
                        salary_min, salary_max, currency, salary_period,
                        source_url, source_platform, external_id, language,
                        category, subcategory, tags, last_scraped, expires_at,
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, 
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        %s, %s
                    )
                    """
                    
                    # Set expiration date (30 days from now)
                    expires_at = datetime.now() + timedelta(days=30)
                    
                    cursor.execute(insert_query, (
                        # Basic job information
                        job['title'],
                        job['company'],
                        job['description'],
                        job['location'],
                        job['work_mode'],
                        job['job_type'],
                        job['experience_level'],
                        job['salary_range'],
                        job['skills'],
                        # Location details for international support
                        job['country_code'],
                        job['region'],
                        job['city'],
                        # Salary details with currency support
                        job['salary_min'],
                        job['salary_max'],
                        job['currency'],
                        job['salary_period'],
                        # Source information
                        job['source_url'],
                        job['source_platform'],
                        job['external_id'],
                        job['language'],
                        # Categorization for global job markets
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